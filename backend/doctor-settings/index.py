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
    
    headers_dict = event.get('headers', {})
    auth_token = headers_dict.get('x-auth-token') or headers_dict.get('X-Auth-Token')
    
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
        
        cur.execute(
            "SELECT id FROM t_p13795046_functional_diagnosti.doctors WHERE email = %s",
            (auth_token,)
        )
        doctor_row = cur.fetchone()
        if not doctor_row:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Неверный токен'}),
                'isBase64Encoded': False
            }
        
        authenticated_doctor_id = doctor_row['id']
        
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            doctor_id = params.get('doctor_id', str(authenticated_doctor_id))
            data_type = params.get('type')
            
            if int(doctor_id) != authenticated_doctor_id:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Доступ запрещен'}),
                    'isBase64Encoded': False
                }
            
            if data_type == 'norm_tables':
                study_type = params.get('study_type')
                if study_type:
                    cur.execute(
                        "SELECT * FROM t_p13795046_functional_diagnosti.norm_tables WHERE doctor_id = %s AND study_type = %s ORDER BY parameter",
                        (doctor_id, study_type)
                    )
                else:
                    cur.execute("SELECT * FROM t_p13795046_functional_diagnosti.norm_tables WHERE doctor_id = %s ORDER BY study_type, parameter", (doctor_id,))
                
                norm_tables = []
                for row in cur.fetchall():
                    table = dict(row)
                    table['id'] = str(table['id'])
                    if table.get('created_at'):
                        table['created_at'] = table['created_at'].isoformat()
                    if table.get('updated_at'):
                        table['updated_at'] = table['updated_at'].isoformat()
                    norm_tables.append(table)
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'norm_tables': norm_tables}),
                    'isBase64Encoded': False
                }
            
            elif data_type == 'templates':
                study_type = params.get('study_type')
                if study_type:
                    cur.execute(
                        "SELECT * FROM t_p13795046_functional_diagnosti.conclusion_templates WHERE doctor_id = %s AND study_type = %s ORDER BY priority DESC",
                        (doctor_id, study_type)
                    )
                else:
                    cur.execute("SELECT * FROM t_p13795046_functional_diagnosti.conclusion_templates WHERE doctor_id = %s ORDER BY study_type, priority DESC", (doctor_id,))
                
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
                    "SELECT * FROM t_p13795046_functional_diagnosti.input_settings WHERE doctor_id = %s AND study_type = %s",
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
            
            elif data_type == 'clinic_settings':
                cur.execute(
                    "SELECT * FROM t_p13795046_functional_diagnosti.clinic_settings WHERE doctor_id = %s",
                    (doctor_id,)
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
            doctor_id = body_data.get('doctor_id', authenticated_doctor_id)
            
            if int(doctor_id) != authenticated_doctor_id:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Доступ запрещен'}),
                    'isBase64Encoded': False
                }
            
            if action == 'save_clinic_settings':
                settings_data = body_data.get('settings')
                if not settings_data:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Не указаны настройки клиники'}),
                        'isBase64Encoded': False
                    }
                
                clinic_name = settings_data.get('clinicName', '')
                clinic_address = settings_data.get('clinicAddress', '')
                clinic_phone = settings_data.get('clinicPhone', '')
                logo_url = settings_data.get('logoUrl')
                
                cur.execute(
                    "SELECT id FROM t_p13795046_functional_diagnosti.clinic_settings WHERE doctor_id = %s",
                    (doctor_id,)
                )
                existing = cur.fetchone()
                
                if existing:
                    cur.execute(
                        """
                        UPDATE t_p13795046_functional_diagnosti.clinic_settings
                        SET clinic_name = %s, address = %s, phone = %s, logo_url = %s,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE doctor_id = %s
                        RETURNING id
                        """,
                        (clinic_name, clinic_address, clinic_phone, logo_url, doctor_id)
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO t_p13795046_functional_diagnosti.clinic_settings
                        (doctor_id, clinic_name, address, phone, logo_url)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                        """,
                        (doctor_id, clinic_name, clinic_address, clinic_phone, logo_url)
                    )
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'id': result['id'], 'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'save_norm_table':
                table_data = body_data.get('table')
                if not table_data:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Не указаны данные таблицы норм'}),
                        'isBase64Encoded': False
                    }
                
                table_id = table_data.get('id')
                study_type = table_data.get('studyType')
                category = table_data.get('category')
                parameter = table_data.get('parameter')
                norm_type = table_data.get('normType')
                rows = json.dumps(table_data.get('rows', []))
                show_in_report = table_data.get('showInReport', True)
                conclusion_below = table_data.get('conclusionBelow')
                conclusion_above = table_data.get('conclusionAbove')
                conclusion_borderline_low = table_data.get('conclusionBorderlineLow')
                conclusion_borderline_high = table_data.get('conclusionBorderlineHigh')
                
                if table_id and table_id != 'new':
                    cur.execute(
                        """
                        UPDATE t_p13795046_functional_diagnosti.norm_tables
                        SET study_type = %s, category = %s, parameter = %s, norm_type = %s,
                            rows = %s::jsonb, show_in_report = %s,
                            conclusion_below = %s, conclusion_above = %s,
                            conclusion_borderline_low = %s, conclusion_borderline_high = %s,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s::uuid AND doctor_id = %s
                        RETURNING id
                        """,
                        (study_type, category, parameter, norm_type, rows, show_in_report,
                         conclusion_below, conclusion_above, conclusion_borderline_low,
                         conclusion_borderline_high, table_id, doctor_id)
                    )
                    result = cur.fetchone()
                    if not result:
                        return {
                            'statusCode': 404,
                            'headers': headers,
                            'body': json.dumps({'error': 'Таблица норм не найдена'}),
                            'isBase64Encoded': False
                        }
                    saved_id = str(result['id'])
                else:
                    cur.execute(
                        """
                        INSERT INTO t_p13795046_functional_diagnosti.norm_tables
                        (doctor_id, study_type, category, parameter, norm_type, rows,
                         show_in_report, conclusion_below, conclusion_above,
                         conclusion_borderline_low, conclusion_borderline_high)
                        VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s, %s)
                        RETURNING id
                        """,
                        (doctor_id, study_type, category, parameter, norm_type, rows,
                         show_in_report, conclusion_below, conclusion_above,
                         conclusion_borderline_low, conclusion_borderline_high)
                    )
                    saved_id = str(cur.fetchone()['id'])
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'message': 'Таблица норм сохранена', 'id': saved_id}),
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
                    INSERT INTO t_p13795046_functional_diagnosti.conclusion_templates (doctor_id, study_type, template_name, priority, conditions, conclusion_text)
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
                    INSERT INTO t_p13795046_functional_diagnosti.input_settings (doctor_id, study_type, field_order, enabled_fields)
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
            
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': f'Неизвестное действие: {action}'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            table_id = params.get('table_id')
            
            if not table_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Не указан ID таблицы норм'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "DELETE FROM t_p13795046_functional_diagnosti.norm_tables WHERE id = %s::uuid AND doctor_id = %s RETURNING id",
                (table_id, authenticated_doctor_id)
            )
            result = cur.fetchone()
            if not result:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Таблица норм не найдена'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Таблица норм удалена'}),
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
                    UPDATE t_p13795046_functional_diagnosti.conclusion_templates
                    SET template_name = COALESCE(%s, template_name),
                        priority = COALESCE(%s, priority),
                        conditions = COALESCE(%s, conditions),
                        conclusion_text = COALESCE(%s, conclusion_text),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND doctor_id = %s
                    """,
                    (template_name, priority, json.dumps(conditions) if conditions else None, conclusion_text, item_id, authenticated_doctor_id)
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
                cur.execute("DELETE FROM t_p13795046_functional_diagnosti.doctor_norms WHERE id = %s AND doctor_id = %s", (item_id, authenticated_doctor_id))
            elif data_type == 'template':
                cur.execute("DELETE FROM t_p13795046_functional_diagnosti.conclusion_templates WHERE id = %s AND doctor_id = %s", (item_id, authenticated_doctor_id))
            
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