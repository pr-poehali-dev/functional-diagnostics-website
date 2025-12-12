import json
import os
import hashlib
import secrets
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для авторизации и регистрации врачей
    Методы: POST /register, POST /login, GET /profile (с токеном)
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'register':
                email = body_data.get('email', '').strip().lower()
                password = body_data.get('password', '')
                full_name = body_data.get('full_name', '')
                specialization = body_data.get('specialization', '')
                
                if not email or not password or not full_name:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Все поля обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("SELECT id FROM doctors WHERE email = %s", (email,))
                if cur.fetchone():
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Email уже зарегистрирован'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(password)
                token = generate_token()
                
                cur.execute(
                    "INSERT INTO doctors (email, password_hash, full_name, specialization) VALUES (%s, %s, %s, %s) RETURNING id",
                    (email, password_hash, full_name, specialization)
                )
                doctor_id = cur.fetchone()['id']
                conn.commit()
                
                cur.execute(
                    "SELECT id, email, full_name, specialization, signature_url, created_at FROM doctors WHERE id = %s",
                    (doctor_id,)
                )
                doctor = dict(cur.fetchone())
                doctor['created_at'] = doctor['created_at'].isoformat() if doctor['created_at'] else None
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'token': token,
                        'doctor': doctor
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                email = body_data.get('email', '').strip().lower()
                password = body_data.get('password', '')
                
                if not email or not password:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Email и пароль обязательны'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(password)
                
                cur.execute(
                    "SELECT id, email, full_name, specialization, signature_url, created_at FROM doctors WHERE email = %s AND password_hash = %s",
                    (email, password_hash)
                )
                doctor = cur.fetchone()
                
                if not doctor:
                    return {
                        'statusCode': 401,
                        'headers': headers,
                        'body': json.dumps({'error': 'Неверный email или пароль'}),
                        'isBase64Encoded': False
                    }
                
                doctor = dict(doctor)
                doctor['created_at'] = doctor['created_at'].isoformat() if doctor['created_at'] else None
                token = generate_token()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'token': token,
                        'doctor': doctor
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'change_password':
                auth_token = event.get('headers', {}).get('x-auth-token')
                if not auth_token:
                    return {
                        'statusCode': 401,
                        'headers': headers,
                        'body': json.dumps({'error': 'Требуется авторизация'}),
                        'isBase64Encoded': False
                    }
                
                doctor_id = body_data.get('doctor_id')
                old_password = body_data.get('old_password', '')
                new_password = body_data.get('new_password', '')
                
                if not doctor_id or not old_password or not new_password:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Все поля обязательны'}),
                        'isBase64Encoded': False
                    }
                
                old_hash = hash_password(old_password)
                cur.execute("SELECT id FROM doctors WHERE id = %s AND password_hash = %s", (doctor_id, old_hash))
                if not cur.fetchone():
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Неверный старый пароль'}),
                        'isBase64Encoded': False
                    }
                
                new_hash = hash_password(new_password)
                cur.execute("UPDATE doctors SET password_hash = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (new_hash, doctor_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'message': 'Пароль успешно изменен'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            auth_token = event.get('headers', {}).get('x-auth-token')
            if not auth_token:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            params = event.get('queryStringParameters', {})
            doctor_id = params.get('doctor_id')
            
            if not doctor_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Не указан ID врача'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT id, email, full_name, specialization, signature_url, created_at FROM doctors WHERE id = %s",
                (doctor_id,)
            )
            doctor = cur.fetchone()
            
            if not doctor:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Врач не найден'}),
                    'isBase64Encoded': False
                }
            
            doctor = dict(doctor)
            doctor['created_at'] = doctor['created_at'].isoformat() if doctor['created_at'] else None
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'doctor': doctor}),
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
