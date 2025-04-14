import functools
from flask import request, jsonify, current_app
import jwt
import datetime
import logging

logger = logging.getLogger(__name__)

def generate_token(user_id):
    """Generate a JWT token for a user"""
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
        'iat': datetime.datetime.utcnow(),
        'sub': user_id
    }
    return jwt.encode(
        payload,
        current_app.config.get('SECRET_KEY'),
        algorithm='HS256'
    )

def token_required(f):
    """Decorator to protect routes with JWT authentication"""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode the token
            payload = jwt.decode(
                token, 
                current_app.config.get('SECRET_KEY'),
                algorithms=['HS256']
            )
            current_user_id = payload['sub']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Pass the user ID to the function
        return f(current_user_id, *args, **kwargs)
    
    return decorated

# For development only - bypass auth with query param
def dev_token_required(f):
    """Development version of token_required that allows bypassing with ?dev_mode=true"""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if current_app.debug and request.args.get('dev_mode') == 'true':
            logger.warning("Using dev mode authentication bypass!")
            return f('dev_user', *args, **kwargs)
        else:
            return token_required(f)(*args, **kwargs)
    
    return decorated
