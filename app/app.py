from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from datetime import datetime, timedelta
import json

app = Flask(__name__)
app.secret_key = 'hilton_managua_secret_key_2024'

# Datos de ejemplo para habitaciones
HABITACIONES = {
    1: {
        'id': 1,
        'nombre': 'Suite Ejecutiva',
        'tipo': 'suite',
        'precio': 250,
        'capacidad': 3,
        'descripcion': 'Amplia suite con sala separada, escritorio ejecutivo y vistas panorámicas.',
        'tamano': '45 m²',
        'camas': '1 Cama King Size',
        'amenidades': ['WiFi Gratis', 'TV Pantalla Plana 55"', 'Mini Bar', 'Caja Fuerte', 'Aire Acondicionado', 'Escritorio Ejecutivo', 'Vista Panorámica'],
        'imagenes': [
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1587985064132-6e6a7b7cd0b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ]
    },
    2: {
        'id': 2,
        'nombre': 'Habitación Deluxe',
        'tipo': 'deluxe',
        'precio': 180,
        'capacidad': 2,
        'descripcion': 'Habitación espaciosa con balcón privado y baño de lujo.',
        'tamano': '35 m²',
        'camas': '2 Camas Queen Size',
        'amenidades': ['WiFi Gratis', 'TV Pantalla Plana 43"', 'Balcón Privado', 'Caja Fuerte', 'Aire Acondicionado', 'Secador de Pelo', 'Plancha y Tabla'],
        'imagenes': [
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ]
    },
    3: {
        'id': 3,
        'nombre': 'Habitación Estándar',
        'tipo': 'standard',
        'precio': 120,
        'capacidad': 2,
        'descripcion': 'Cómoda habitación con todas las comodidades necesarias para una estancia placentera.',
        'tamano': '25 m²',
        'camas': '1 Cama King Size',
        'amenidades': ['WiFi Gratis', 'TV 32"', 'Baño Privado', 'Aire Acondicionado', 'Teléfono', 'Despertador'],
        'imagenes': [
            'https://images.unsplash.com/photo-1587985064132-6e6a7b7cd0b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ]
    },
    4: {
        'id': 4,
        'nombre': 'Suite Presidencial',
        'tipo': 'presidential',
        'precio': 450,
        'capacidad': 4,
        'descripcion': 'La máxima expresión de lujo con living room, comedor y jacuzzi privado.',
        'tamano': '80 m²',
        'camas': '2 Camas King Size',
        'amenidades': ['WiFi Gratis', 'TV 65" 4K', 'Jacuzzi Privado', 'Mini Bar Premium', 'Caja Fuerte Digital', 'Sistema de Sonido', 'Vista al Volcán', 'Servicio de Conserjería 24/7'],
        'imagenes': [
            'https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ]
    }
}

# Rutas principales
@app.route('/')
def index():
    return render_template('index.html')

# Habitaciones
@app.route('/habitaciones')
def habitaciones():
    today = datetime.now().strftime('%Y-%m-%d')
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    return render_template('habitaciones/lista.html', 
                         today=today, 
                         tomorrow=tomorrow,
                         habitaciones=HABITACIONES.values())

@app.route('/habitaciones/<int:id>')
def detalle_habitacion(id):
    habitacion = HABITACIONES.get(id)
    if not habitacion:
        return render_template('404.html'), 404
    
    today = datetime.now().strftime('%Y-%m-%d')
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    return render_template('habitaciones/detalle.html', 
                         habitacion=habitacion,
                         today=today,
                         tomorrow=tomorrow)

# Reservas
@app.route('/reservas')
def reservas():
    # Verificar si hay una habitación seleccionada
    selected_room = None
    if 'selected_room' in session:
        room_id = session.get('selected_room')
        selected_room = HABITACIONES.get(room_id)
    
    today = datetime.now().strftime('%Y-%m-%d')
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    return render_template('reservas/formulario.html',
                         selected_room=selected_room,
                         today=today,
                         tomorrow=tomorrow)

@app.route('/reservas/procesar', methods=['POST'])
def procesar_reserva():
    try:
        datos = request.form
        
        # Validar datos básicos
        required_fields = ['nombre', 'apellido', 'email', 'telefono', 'check_in', 'check_out']
        for field in required_fields:
            if not datos.get(field):
                flash(f'El campo {field} es requerido', 'error')
                return redirect(url_for('reservas'))
        
        # Calcular número de noches
        check_in = datetime.strptime(datos['check_in'], '%Y-%m-%d')
        check_out = datetime.strptime(datos['check_out'], '%Y-%m-%d')
        noches = (check_out - check_in).days
        
        if noches <= 0:
            flash('La fecha de salida debe ser posterior a la fecha de entrada', 'error')
            return redirect(url_for('reservas'))
        
        # Generar número de reserva
        import random
        numero_reserva = f'RES-{random.randint(10000, 99999)}-{datetime.now().strftime("%Y%m")}'
        
        # Guardar reserva en sesión (en un caso real, se guardaría en BD)
        reserva = {
            'numero': numero_reserva,
            'fecha': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'cliente': {
                'nombre': datos['nombre'],
                'apellido': datos['apellido'],
                'email': datos['email'],
                'telefono': datos['telefono']
            },
            'estadia': {
                'check_in': datos['check_in'],
                'check_out': datos['check_out'],
                'noches': noches
            },
            'habitacion': session.get('selected_room', 1),
            'total': 250 * noches  # Precio de ejemplo
        }
        
        session['ultima_reserva'] = reserva
        session.pop('selected_room', None)  # Limpiar habitación seleccionada
        
        return redirect(url_for('confirmacion_reserva'))
        
    except Exception as e:
        flash(f'Error al procesar la reserva: {str(e)}', 'error')
        return redirect(url_for('reservas'))

@app.route('/reservas/confirmacion')
def confirmacion_reserva():
    reserva = session.get('ultima_reserva')
    if not reserva:
        flash('No hay reserva para confirmar', 'error')
        return redirect(url_for('reservas'))
    
    return render_template('reservas/confirmacion.html', reserva=reserva)

# API para seleccionar habitación
@app.route('/api/select-room/<int:room_id>')
def select_room(room_id):
    if room_id in HABITACIONES:
        session['selected_room'] = room_id
        return jsonify({'success': True, 'message': 'Habitación seleccionada'})
    return jsonify({'success': False, 'message': 'Habitación no encontrada'}), 404

# Autenticación (placeholders)
@app.route('/login')
def login():
    return render_template('auth/login.html')

@app.route('/register')
def register():
    return render_template('auth/login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

# Manejador de error 404
@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)