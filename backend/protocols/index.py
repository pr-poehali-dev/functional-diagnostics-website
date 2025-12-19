import json
import os
import psycopg2
from typing import Dict, Any, List, Optional
from datetime import datetime, date

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление протоколами исследований: создание, чтение, обновление, удаление, поиск, сортировка
    '''
    method: str = event.get('httpMethod', 'GET')
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, x-auth-token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'DATABASE_URL не настроен'}),
            'isBase64Encoded': False
        }
    
    headers_dict = event.get('headers', {})
    auth_token = headers_dict.get('x-auth-token') or headers_dict.get('X-Auth-Token')
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if method == 'GET':
            protocol_id = event.get('queryStringParameters', {}).get('id')
            
            if protocol_id:
                cur.execute("""
                    SELECT id, doctor_id, study_type, patient_name, patient_gender, 
                           patient_birth_date, patient_age, patient_weight, patient_height, 
                           patient_bsa, ultrasound_device, study_date, results, results_min_max,
                           conclusion, signed, created_at 
                    FROM t_p13795046_functional_diagnosti.protocols 
                    WHERE id = %s
                """, (protocol_id,))
                
                row = cur.fetchone()
                if not row:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'Протокол не найден'}),
                        'isBase64Encoded': False
                    }
                
                protocol = format_protocol_row(row)
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'protocol': protocol}),
                    'isBase64Encoded': False
                }
            
            else:
                query_params = event.get('queryStringParameters', {})
                search_name = query_params.get('search_name')
                search_study_type = query_params.get('search_study_type')
                date_from = query_params.get('date_from')
                date_to = query_params.get('date_to')
                sort_by = query_params.get('sort_by', 'created_at')
                sort_order = query_params.get('sort_order', 'desc')
                
                where_clauses = []
                params = []
                
                if search_name:
                    where_clauses.append("LOWER(patient_name) LIKE LOWER(%s)")
                    params.append(f'%{search_name}%')
                
                if search_study_type:
                    where_clauses.append("study_type = %s")
                    params.append(search_study_type)
                
                if date_from:
                    where_clauses.append("study_date >= %s")
                    params.append(date_from)
                
                if date_to:
                    where_clauses.append("study_date <= %s")
                    params.append(date_to)
                
                where_sql = ""
                if where_clauses:
                    where_sql = "WHERE " + " AND ".join(where_clauses)
                
                allowed_sort = ['created_at', 'study_date', 'patient_name', 'study_type']
                if sort_by not in allowed_sort:
                    sort_by = 'created_at'
                
                sort_order = 'DESC' if sort_order.lower() == 'desc' else 'ASC'
                
                query = f"""
                    SELECT id, doctor_id, study_type, patient_name, patient_gender, 
                           patient_birth_date, patient_age, patient_weight, patient_height, 
                           patient_bsa, ultrasound_device, study_date, results, results_min_max,
                           conclusion, signed, created_at 
                    FROM t_p13795046_functional_diagnosti.protocols 
                    {where_sql}
                    ORDER BY {sort_by} {sort_order}
                """
                
                cur.execute(query, params)
                rows = cur.fetchall()
                
                protocols = [format_protocol_row(row) for row in rows]
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'protocols': protocols}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            if not auth_token:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
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
            
            doctor_id = doctor_row[0]
            body_data = json.loads(event.get('body', '{}'))
            
            required_fields = ['study_type', 'patient_name', 'patient_gender', 
                             'patient_birth_date', 'study_date', 'results', 'conclusion']
            for field in required_fields:
                if field not in body_data:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': f'Отсутствует обязательное поле: {field}'}),
                        'isBase64Encoded': False
                    }
            
            patient_age = body_data.get('patient_age')
            if patient_age and isinstance(patient_age, dict):
                patient_age = json.dumps(patient_age)
            
            results_min_max = body_data.get('results_min_max')
            results_min_max_json = json.dumps(results_min_max) if results_min_max else None
            
            cur.execute("""
                INSERT INTO t_p13795046_functional_diagnosti.protocols 
                (doctor_id, study_type, patient_name, patient_gender, patient_birth_date, 
                 patient_age, patient_weight, patient_height, patient_bsa, ultrasound_device, 
                 study_date, results, results_min_max, conclusion, signed, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                RETURNING id
            """, (
                doctor_id,
                body_data['study_type'],
                body_data['patient_name'],
                body_data['patient_gender'],
                body_data['patient_birth_date'],
                patient_age,
                body_data.get('patient_weight'),
                body_data.get('patient_height'),
                body_data.get('patient_bsa'),
                body_data.get('ultrasound_device'),
                body_data['study_date'],
                json.dumps(body_data['results']),
                results_min_max_json,
                body_data['conclusion'],
                body_data.get('signed', False)
            ))
            
            protocol_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({'message': 'Протокол создан', 'id': protocol_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            if not auth_token:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            body_data = json.loads(event.get('body', '{}'))
            protocol_id = body_data.get('id')
            
            if not protocol_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID протокола обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT id FROM t_p13795046_functional_diagnosti.protocols WHERE id = %s",
                (protocol_id,)
            )
            if not cur.fetchone():
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Протокол не найден'}),
                    'isBase64Encoded': False
                }
            
            update_fields = []
            params = []
            
            if 'study_type' in body_data:
                update_fields.append("study_type = %s")
                params.append(body_data['study_type'])
            
            if 'patient_name' in body_data:
                update_fields.append("patient_name = %s")
                params.append(body_data['patient_name'])
            
            if 'patient_gender' in body_data:
                update_fields.append("patient_gender = %s")
                params.append(body_data['patient_gender'])
            
            if 'patient_birth_date' in body_data:
                update_fields.append("patient_birth_date = %s")
                params.append(body_data['patient_birth_date'])
            
            if 'patient_age' in body_data:
                update_fields.append("patient_age = %s")
                patient_age_update = body_data['patient_age']
                if patient_age_update and isinstance(patient_age_update, dict):
                    patient_age_update = json.dumps(patient_age_update)
                params.append(patient_age_update)
            
            if 'patient_weight' in body_data:
                update_fields.append("patient_weight = %s")
                params.append(body_data['patient_weight'])
            
            if 'patient_height' in body_data:
                update_fields.append("patient_height = %s")
                params.append(body_data['patient_height'])
            
            if 'patient_bsa' in body_data:
                update_fields.append("patient_bsa = %s")
                params.append(body_data['patient_bsa'])
            
            if 'ultrasound_device' in body_data:
                update_fields.append("ultrasound_device = %s")
                params.append(body_data['ultrasound_device'])
            
            if 'study_date' in body_data:
                update_fields.append("study_date = %s")
                params.append(body_data['study_date'])
            
            if 'results' in body_data:
                update_fields.append("results = %s")
                params.append(json.dumps(body_data['results']))
            
            if 'results_min_max' in body_data:
                update_fields.append("results_min_max = %s")
                results_min_max = body_data['results_min_max']
                params.append(json.dumps(results_min_max) if results_min_max else None)
            
            if 'conclusion' in body_data:
                update_fields.append("conclusion = %s")
                params.append(body_data['conclusion'])
            
            if 'signed' in body_data:
                update_fields.append("signed = %s")
                params.append(body_data['signed'])
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Нет полей для обновления'}),
                    'isBase64Encoded': False
                }
            
            params.append(protocol_id)
            query = f"""
                UPDATE t_p13795046_functional_diagnosti.protocols 
                SET {', '.join(update_fields)}
                WHERE id = %s
            """
            
            cur.execute(query, params)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Протокол обновлён'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            if not auth_token:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            query_params = event.get('queryStringParameters', {})
            protocol_id = query_params.get('id')
            
            if not protocol_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID протокола обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "DELETE FROM t_p13795046_functional_diagnosti.protocols WHERE id = %s",
                (protocol_id,)
            )
            
            if cur.rowcount == 0:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Протокол не найден'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Протокол удалён'}),
                'isBase64Encoded': False
            }
        
        else:
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
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


def format_protocol_row(row: tuple) -> Dict[str, Any]:
    '''Форматирует строку из БД в словарь протокола'''
    patient_age = row[6]
    if patient_age:
        try:
            patient_age = json.loads(patient_age)
        except (json.JSONDecodeError, TypeError):
            pass
    
    return {
        'id': row[0],
        'doctor_id': row[1],
        'study_type': row[2],
        'patient_name': row[3],
        'patient_gender': row[4],
        'patient_birth_date': row[5].isoformat() if row[5] else None,
        'patient_age': patient_age,
        'patient_weight': float(row[7]) if row[7] else None,
        'patient_height': float(row[8]) if row[8] else None,
        'patient_bsa': float(row[9]) if row[9] else None,
        'ultrasound_device': row[10],
        'study_date': row[11].isoformat() if row[11] else None,
        'results': row[12],
        'results_min_max': row[13],
        'conclusion': row[14],
        'signed': row[15],
        'created_at': row[16].isoformat() if row[16] else None
    }