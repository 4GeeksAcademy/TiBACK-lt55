"""
JWT Utilities for TiBACK Authentication System
Provides secure token generation, validation, and refresh functionality
"""
import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-in-production')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # 15 minutes
REFRESH_TOKEN_EXPIRE_DAYS = 7     # 7 days

def generate_access_token(user_id, email, role):
    """
    Generate a secure JWT access token
    
    Args:
        user_id (int): User ID
        email (str): User email
        role (str): User role
    
    Returns:
        str: JWT access token
    """
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'type': 'access',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def generate_refresh_token(user_id, email, role):
    """
    Generate a secure JWT refresh token
    
    Args:
        user_id (int): User ID
        email (str): User email
        role (str): User role
    
    Returns:
        str: JWT refresh token
    """
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'type': 'refresh',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    }
    
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_token(token, token_type='access'):
    """
    Verify and decode a JWT token
    
    Args:
        token (str): JWT token to verify
        token_type (str): Expected token type ('access' or 'refresh')
    
    Returns:
        dict: Decoded token payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Verify token type
        if payload.get('type') != token_type:
            return None
            
        # Verify token is not expired
        if datetime.utcnow() > datetime.fromtimestamp(payload['exp']):
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
        
        payload = verify_token(token, 'access')
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
            
            payload = verify_token(token, 'access')
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

def refresh_access_token(refresh_token):
    """
    Generate new access token from refresh token
    
    Args:
        refresh_token (str): Valid refresh token
    
    Returns:
        dict: New access token and refresh token if valid, None if invalid
    """
    payload = verify_token(refresh_token, 'refresh')
    if not payload:
        return None
    
    # Generate new tokens
    new_access_token = generate_access_token(
        payload['user_id'], 
        payload['email'], 
        payload['role']
    )
    new_refresh_token = generate_refresh_token(
        payload['user_id'], 
        payload['email'], 
        payload['role']
    )
    
    return {
        'access_token': new_access_token,
        'refresh_token': new_refresh_token
    }

def get_user_from_token():
    """
    Get current user info from token in request
    
    Returns:
        dict: User info if authenticated, None otherwise
    """
    if hasattr(request, 'current_user'):
        return request.current_user
    return None
