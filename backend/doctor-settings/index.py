import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для управления настройками врача: нормы, шаблоны заключений, настройки ввода
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    auth_token = event.get('headers', {}).get('x-auth-token')
    if not auth_token:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            doctor_id = params.get('doctor_id')
            data_type = params.get('type')
            
            if not doctor_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Не указан ID врача'}),
                    'isBase64Encoded': False
                }
            
            if data_type == 'norms':
                study_type = params.get('study_type')
                if study_type:
                    cur.execute(
                        "SELECT * FROM doctor_norms WHERE doctor_id = %s AND study_type = %s ORDER BY parameter_id",
                        (doctor_id, study_type)
                    )
                else:
                    cur.execute("SELECT * FROM doctor_norms WHERE doctor_id = %s ORDER BY study_type, parameter_id", (doctor_id,))
                
                norms = [dict(row) for row in cur.fetchall()]
                for norm in norms:
                    if norm.get('created_at'):
                        norm['created_at'] = norm['created_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'norms': norms}),
                    'isBase64Encoded': False
                }
            
            elif data_type == 'templates':
                study_type = params.get('study_type')
                if study_type:
                    cur.execute(
                        "SELECT * FROM conclusion_templates WHERE doctor_id = %s AND study_type = %s ORDER BY priority DESC",
                        (doctor_id, study_type)
                    )
                else:
                    cur.execute("SELECT * FROM conclusion_templates WHERE doctor_id = %s ORDER BY study_type, priority DESC", (doctor_id,))
                
                templates = [dict(row) for row in cur.fetchall()]
                for template in templates:
                    if template.get('created_at'):
                        template['created_at'] = template['created_at'].isoformat()
                    if template.get('updated_at'):
                        template['updated_at'] = template['updated_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'templates': templates}),
                    'isBase64Encoded': False
                }
            
            elif data_type == 'input_settings':
                study_type = params.get('study_type')
                if not study_type:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Не указан тип исследования'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "SELECT * FROM input_settings WHERE doctor_id = %s AND study_type = %s",
                    (doctor_id, study_type)
                )
                settings = cur.fetchone()
                
                if settings:
                    settings = dict(settings)
                    if settings.get('created_at'):
                        settings['created_at'] = settings['created_at'].isoformat()
                    if settings.get('updated_at'):
                        settings['updated_at'] = settings['updated_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'settings': settings}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            doctor_id = body_data.get('doctor_id')
            
            if not doctor_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Не указан ID врача'}),
                    'isBase64Encoded': False
                }
            
            if action == 'save_norm':
                study_type = body_data.get('study_type')
                parameter_id = body_data.get('parameter_id')
                condition_type = body_data.get('condition_type', 'default')
                condition_value = body_data.get('condition_value', 'all')
                min_value = body_data.get('min_value')
                max_value = body_data.get('max_value')
                
                cur.execute(
                    """
                    INSERT INTO doctor_norms (doctor_id, study_type, parameter_id, condition_type, condition_value, min_value, max_value)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (doctor_id, study_type, parameter_id, condition_type, condition_value)
                    DO UPDATE SET min_value = EXCLUDED.min_value, max_value = EXCLUDED.max_value
                    RETURNING id
                    """,
                    (doctor_id, study_type, parameter_id, condition_type, condition_value, min_value, max_value)
                )
                norm_id = cur.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'message': 'Норма сохранена', 'id': norm_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'save_template':
                study_type = body_data.get('study_type')
                template_name = body_data.get('template_name')
                priority = body_data.get('priority', 0)
                conditions = body_data.get('conditions', [])
                conclusion_text = body_data.get('conclusion_text')
                
                cur.execute(
                    """
                    INSERT INTO conclusion_templates (doctor_id, study_type, template_name, priority, conditions, conclusion_text)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (doctor_id, study_type, template_name, priority, json.dumps(conditions), conclusion_text)
                )
                template_id = cur.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'message': 'Шаблон сохранен', 'id': template_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'save_input_settings':
                study_type = body_data.get('study_type')
                field_order = body_data.get('field_order', [])
                enabled_fields = body_data.get('enabled_fields', [])
                
                cur.execute(
                    """
                    INSERT INTO input_settings (doctor_id, study_type, field_order, enabled_fields)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (doctor_id, study_type)
                    DO UPDATE SET field_order = EXCLUDED.field_order, enabled_fields = EXCLUDED.enabled_fields, updated_at = CURRENT_TIMESTAMP
                    RETURNING id
                    """,
                    (doctor_id, study_type, json.dumps(field_order), json.dumps(enabled_fields))
                )
                settings_id = cur.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'message': 'Настройки ввода сохранены', 'id': settings_id}),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            data_type = body_data.get('type')
            item_id = body_data.get('id')
            
            if not item_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Не указан ID записи'}),
                    'isBase64Encoded': False
                }
            
            if data_type == 'template':
                template_name = body_data.get('template_name')
                priority = body_data.get('priority')
                conditions = body_data.get('conditions')
                conclusion_text = body_data.get('conclusion_text')
                
                cur.execute(
                    """
                    UPDATE conclusion_templates
                    SET template_name = COALESCE(%s, template_name),
                        priority = COALESCE(%s, priority),
                        conditions = COALESCE(%s, conditions),
                        conclusion_text = COALESCE(%s, conclusion_text),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """,
                    (template_name, priority, json.dumps(conditions) if conditions else None, conclusion_text, item_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'message': 'Шаблон обновлен'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            data_type = params.get('type')
            item_id = params.get('id')
            
            if not item_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Не указан ID записи'}),
                    'isBase64Encoded': False
                }
            
            if data_type == 'norm':
                cur.execute("DELETE FROM doctor_norms WHERE id = %s", (item_id,))
            elif data_type == 'template':
                cur.execute("DELETE FROM conclusion_templates WHERE id = %s", (item_id,))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Удалено успешно'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()
