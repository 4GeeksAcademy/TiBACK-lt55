"""
JWT Utilities for TiBACK Authentication System
Provides secure token generation and validation with role-based tokens
"""
import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-in-production')
JWT_ALGORITHM = 'HS256'
TOKEN_EXPIRE_HOURS = 24  # 24 hours for all roles

def generate_token(user_id, email, role):
    """
    Generate a secure JWT token based on user role
    
    Args:
        user_id (int): User ID
        email (str): User email
        role (str): User role (administrador, cliente, supervisor, analista)
    
    Returns:
        str: JWT token
    """
    # Validar que el rol sea uno de los permitidos
    valid_roles = ['administrador', 'cliente', 'supervisor', 'analista']
    if role not in valid_roles:
        raise ValueError(f"Rol inválido: {role}. Roles permitidos: {valid_roles}")
    
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    }
    
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_token(token):
    """
    Verify and decode a JWT token
    
    Args:
        token (str): JWT token to verify
    
    Returns:
        dict: Decoded token payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Verify token is not expired
        if datetime.utcnow() > datetime.fromtimestamp(payload['exp']):
            return None
            
        # Verify role is valid
        valid_roles = ['administrador', 'cliente', 'supervisor', 'analista']
        if payload.get('role') not in valid_roles:
            return None
            
        return payload
        
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except Exception:
        return None

def get_token_from_request():
    """
    Extract JWT token from Authorization header
    
    Returns:
        str: JWT token if found, None otherwise
    """
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    return None

def require_auth(f):
    """
    Decorator to require authentication for API endpoints
    
    Args:
        f: Function to decorate
    
    Returns:
        Decorated function
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_request()
        
        if not token:
            return jsonify({'message': 'Token de autorización requerido'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'message': 'Token inválido o expirado'}), 401
        
        # Add user info to request context
        request.current_user = {
            'id': payload['user_id'],
            'email': payload['email'],
            'role': payload['role']
        }
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_role(allowed_roles):
    """
    Decorator to require specific roles for API endpoints
    
    Args:
        allowed_roles (list): List of allowed roles
    
    Returns:
        Decorator function
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = get_token_from_request()
            
            if not token:
                return jsonify({'message': 'Token de autorización requerido'}), 401
            
            payload = verify_token(token)
            if not payload:
                return jsonify({'message': 'Token inválido o expirado'}), 401
            
            # Check if user has required role
            if payload['role'] not in allowed_roles:
                return jsonify({'message': 'Permisos insuficientes'}), 403
            
            # Add user info to request context
            request.current_user = {
                'id': payload['user_id'],
                'email': payload['email'],
                'role': payload['role']
            }
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def refresh_token(old_token):
    """
    Generate new token from existing token
    
    Args:
        old_token (str): Valid token
    
    Returns:
        str: New token if valid, None if invalid
    """
    payload = verify_token(old_token)
    if not payload:
        return None
    
    # Generate new token with same role
    return generate_token(
        payload['user_id'], 
        payload['email'], 
        payload['role']
    )

def get_user_from_token():
    """
    Get current user info from token in request
    
    Returns:
        dict: User info if authenticated, None otherwise
    """
    if hasattr(request, 'current_user'):
        return request.current_user
    return None
