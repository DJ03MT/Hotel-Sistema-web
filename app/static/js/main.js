// ===== FUNCIONALIDADES GENERALES =====

// Scroll suave para enlaces internos
document.addEventListener('DOMContentLoaded', function() {
    // Header scroll effect
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(0, 51, 102, 0.98)';
            header.style.padding = '0.8rem 5%';
        } else {
            header.style.background = 'rgba(0, 51, 102, 0.95)';
            header.style.padding = '1rem 5%';
        }
    });
    
    // Smooth scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId !== '#' && targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Animación para elementos al aparecer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    // Observar elementos para animar
    document.querySelectorAll('.feature-card, .gallery-item').forEach(el => {
        observer.observe(el);
    });
    
    // Mostrar año actual
    document.querySelectorAll('.current-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });
});

// ===== VALIDACIÓN DE FORMULARIOS =====
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;
    
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        // Remover mensajes de error anteriores
        const errorElement = input.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.remove();
        }
        
        // Validar campo
        if (!input.value.trim()) {
            showError(input, 'Este campo es requerido');
            isValid = false;
        } else if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                showError(input, 'Ingrese un email válido');
                isValid = false;
            }
        } else if (input.type === 'tel') {
            const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
            if (!phoneRegex.test(input.value.replace(/\s/g, ''))) {
                showError(input, 'Ingrese un número de teléfono válido');
                isValid = false;
            }
        }
    });
    
    return isValid;
}

function showError(input, message) {
    input.classList.add('error');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.color = '#dc3545';
    errorElement.style.fontSize = '0.875rem';
    errorElement.style.marginTop = '0.25rem';
    
    input.parentNode.insertBefore(errorElement, input.nextSibling);
}

// ===== NOTIFICACIONES =====
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== ANIMACIONES CSS DINÁMICAS =====
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .animated {
        animation: fadeInUp 0.6s ease forwards;
    }
`;
document.head.appendChild(styleSheet);

// ===== FUNCIONES DE HABITACIONES =====
function selectRoom(roomId) {
    fetch(`/api/select-room/${roomId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Habitación seleccionada correctamente', 'success');
                // Redirigir al formulario de reserva después de 1 segundo
                setTimeout(() => {
                    window.location.href = '/reservas';
                }, 1000);
            } else {
                showNotification('Error al seleccionar la habitación', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error de conexión', 'error');
        });
}

// ===== MÁSCARAS DE ENTRADA =====
function applyPhoneMask(input) {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            value = value.substring(0, 15);
            
            // Formato: (XXX) XXX-XXXX
            if (value.length <= 10) {
                value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
            } else {
                value = value.replace(/(\d{3})(\d{3})(\d{4})(\d+)/, '($1) $2-$3 x$4');
            }
        }
        
        e.target.value = value;
    });
}

// Aplicar máscara a todos los inputs de teléfono
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        applyPhoneMask(input);
    });
});

// ===== FUNCIONALIDAD DEL CARRITO/CARRITO DE RESERVAS =====
class ReservationCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('reservationCart')) || [];
    }
    
    addItem(roomId, checkIn, checkOut, guests) {
        const item = {
            roomId,
            checkIn,
            checkOut,
            guests,
            addedAt: new Date().toISOString()
        };
        
        this.items.push(item);
        this.save();
        this.updateCartCount();
    }
    
    removeItem(index) {
        this.items.splice(index, 1);
        this.save();
        this.updateCartCount();
    }
    
    clear() {
        this.items = [];
        this.save();
        this.updateCartCount();
    }
    
    save() {
        localStorage.setItem('reservationCart', JSON.stringify(this.items));
    }
    
    getCount() {
        return this.items.length;
    }
    
    updateCartCount() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        const count = this.getCount();
        
        cartCountElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-flex' : 'none';
        });
    }
}

// Inicializar carrito
const reservationCart = new ReservationCart();

// Actualizar contador al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    reservationCart.updateCartCount();
});