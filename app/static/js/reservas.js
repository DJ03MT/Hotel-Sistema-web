// ===== FUNCIONALIDADES ESPECÍFICAS PARA RESERVAS =====

class ReservationForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {};
        this.init();
    }
    
    init() {
        this.setupDatePickers();
        this.setupEventListeners();
        this.updateStepDisplay();
    }
    
    setupDatePickers() {
        // Configurar fecha mínima (hoy)
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        document.querySelectorAll('input[type="date"]').forEach(input => {
            if (input.id === 'check-in' || input.name === 'check_in') {
                input.min = today;
                input.value = today;
            }
            if (input.id === 'check-out' || input.name === 'check_out') {
                input.min = tomorrowStr;
                input.value = tomorrowStr;
            }
        });
        
        // Validar que check-out sea después de check-in
        document.getElementById('check-in')?.addEventListener('change', function() {
            const checkOut = document.getElementById('check-out');
            if (checkOut) {
                const minDate = new Date(this.value);
                minDate.setDate(minDate.getDate() + 1);
                checkOut.min = minDate.toISOString().split('T')[0];
                
                if (new Date(checkOut.value) <= new Date(this.value)) {
                    checkOut.value = minDate.toISOString().split('T')[0];
                }
            }
        });
    }
    
    setupEventListeners() {
        // Botones de navegación
        document.querySelectorAll('.next-step').forEach(btn => {
            btn.addEventListener('click', () => this.nextStep());
        });
        
        document.querySelectorAll('.prev-step').forEach(btn => {
            btn.addEventListener('click', () => this.prevStep());
        });
        
        // Cambio en número de huéspedes
        document.getElementById('guests')?.addEventListener('change', function() {
            this.updateGuestsUI(parseInt(this.value));
        }.bind(this));
        
        // Calcular precio al cambiar fechas
        document.getElementById('check-in')?.addEventListener('change', () => this.calculatePrice());
        document.getElementById('check-out')?.addEventListener('change', () => this.calculatePrice());
    }
    
    updateStepDisplay() {
        // Actualizar indicadores de pasos
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = index + 1;
            
            step.classList.remove('active', 'completed');
            
            if (stepNumber === this.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            }
        });
        
        // Mostrar/ocultar secciones
        document.querySelectorAll('.step-content').forEach((section, index) => {
            const stepNumber = index + 1;
            section.style.display = stepNumber === this.currentStep ? 'block' : 'none';
        });
    }
    
    nextStep() {
        if (this.validateCurrentStep()) {
            this.saveStepData();
            
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateStepDisplay();
                this.scrollToTop();
            } else {
                this.submitForm();
            }
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
            this.scrollToTop();
        }
    }
    
    validateCurrentStep() {
        let isValid = true;
        
        switch(this.currentStep) {
            case 1: // Información de fechas
                isValid = this.validateDates();
                break;
            case 2: // Información personal
                isValid = this.validatePersonalInfo();
                break;
            case 3: // Pago
                isValid = this.validatePayment();
                break;
        }
        
        if (!isValid) {
            this.showStepError('Por favor, completa todos los campos requeridos correctamente.');
        }
        
        return isValid;
    }
    
    validateDates() {
        const checkIn = document.getElementById('check-in')?.value;
        const checkOut = document.getElementById('check-out')?.value;
        const guests = document.getElementById('guests')?.value;
        
        if (!checkIn || !checkOut || !guests) {
            return false;
        }
        
        if (new Date(checkOut) <= new Date(checkIn)) {
            this.showStepError('La fecha de salida debe ser posterior a la fecha de entrada.');
            return false;
        }
        
        return true;
    }
    
    validatePersonalInfo() {
        const requiredFields = ['nombre', 'apellido', 'email', 'telefono'];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const input = document.getElementById(field);
            if (!input || !input.value.trim()) {
                isValid = false;
                this.highlightError(input);
            } else {
                this.removeErrorHighlight(input);
                
                // Validaciones específicas
                if (field === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(input.value)) {
                        isValid = false;
                        this.highlightError(input, 'Email inválido');
                    }
                }
                
                if (field === 'telefono') {
                    const phoneDigits = input.value.replace(/\D/g, '');
                    if (phoneDigits.length < 10) {
                        isValid = false;
                        this.highlightError(input, 'Teléfono inválido');
                    }
                }
            }
        });
        
        return isValid;
    }
    
    validatePayment() {
        const cardNumber = document.getElementById('card-number')?.value.replace(/\s/g, '');
        const expiry = document.getElementById('card-expiry')?.value;
        const cvv = document.getElementById('card-cvv')?.value;
        
        if (!cardNumber || !expiry || !cvv) {
            return false;
        }
        
        // Validar número de tarjeta (Luhn algorithm simplificado)
        if (cardNumber.length < 15 || cardNumber.length > 19) {
            this.showStepError('Número de tarjeta inválido');
            return false;
        }
        
        // Validar fecha de expiración
        const [month, year] = expiry.split('/');
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        if (parseInt(month) < 1 || parseInt(month) > 12) {
            this.showStepError('Mes de expiración inválido');
            return false;
        }
        
        if (parseInt(year) < currentYear || 
            (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
            this.showStepError('La tarjeta ha expirado');
            return false;
        }
        
        // Validar CVV
        if (cvv.length < 3 || cvv.length > 4) {
            this.showStepError('CVV inválido');
            return false;
        }
        
        return true;
    }
    
    saveStepData() {
        switch(this.currentStep) {
            case 1:
                this.formData.checkIn = document.getElementById('check-in')?.value;
                this.formData.checkOut = document.getElementById('check-out')?.value;
                this.formData.guests = document.getElementById('guests')?.value;
                break;
            case 2:
                this.formData.nombre = document.getElementById('nombre')?.value;
                this.formData.apellido = document.getElementById('apellido')?.value;
                this.formData.email = document.getElementById('email')?.value;
                this.formData.telefono = document.getElementById('telefono')?.value;
                this.formData.notas = document.getElementById('notas')?.value;
                break;
            case 3:
                this.formData.cardNumber = document.getElementById('card-number')?.value;
                this.formData.cardExpiry = document.getElementById('card-expiry')?.value;
                this.formData.cardCvv = document.getElementById('card-cvv')?.value;
                break;
        }
        
        // Guardar en sessionStorage para persistencia
        sessionStorage.setItem('reservationData', JSON.stringify(this.formData));
    }
    
    calculatePrice() {
        const checkIn = document.getElementById('check-in')?.value;
        const checkOut = document.getElementById('check-out')?.value;
        const roomPrice = parseFloat(document.querySelector('.room-price')?.textContent?.replace(/[^0-9.]/g, '')) || 250;
        
        if (checkIn && checkOut) {
            const start = new Date(checkIn);
            const end = new Date(checkOut);
            const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            
            if (nights > 0) {
                const subtotal = roomPrice * nights;
                const taxes = subtotal * 0.15; // 15% de impuestos
                const total = subtotal + taxes;
                
                // Actualizar UI
                document.querySelectorAll('.nights-count').forEach(el => {
                    el.textContent = nights;
                });
                
                document.querySelectorAll('.subtotal-amount').forEach(el => {
                    el.textContent = `$${subtotal.toFixed(2)}`;
                });
                
                document.querySelectorAll('.taxes-amount').forEach(el => {
                    el.textContent = `$${taxes.toFixed(2)}`;
                });
                
                document.querySelectorAll('.total-amount').forEach(el => {
                    el.textContent = `$${total.toFixed(2)}`;
                });
                
                this.formData.nights = nights;
                this.formData.subtotal = subtotal;
                this.formData.taxes = taxes;
                this.formData.total = total;
            }
        }
    }
    
    updateGuestsUI(guestCount) {
        // Actualizar elementos que muestran el número de huéspedes
        document.querySelectorAll('.guests-count').forEach(el => {
            el.textContent = guestCount;
        });
        
        // Mostrar/ocultar campos de huéspedes adicionales
        const additionalGuests = document.getElementById('additional-guests');
        if (additionalGuests) {
            additionalGuests.style.display = guestCount > 1 ? 'block' : 'none';
        }
    }
    
    submitForm() {
        // Mostrar loading
        const submitBtn = document.querySelector('.submit-reservation');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled = true;
        
        // Simular envío al servidor
        setTimeout(() => {
            // En un caso real, aquí se haría una petición AJAX
            console.log('Datos enviados:', this.formData);
            
            // Redirigir a confirmación
            window.location.href = '/reservas/confirmacion';
        }, 2000);
    }
    
    highlightError(input, message = 'Campo requerido') {
        input.classList.add('error');
        
        let errorElement = input.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('error-message')) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            input.parentNode.insertBefore(errorElement, input.nextSibling);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    removeErrorHighlight(input) {
        input.classList.remove('error');
        
        const errorElement = input.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.style.display = 'none';
        }
    }
    
    showStepError(message) {
        // Mostrar mensaje de error general para el paso
        const errorContainer = document.getElementById('step-error') || this.createErrorContainer();
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
    
    createErrorContainer() {
        const container = document.createElement('div');
        container.id = 'step-error';
        container.style.cssText = `
            background: #dc3545;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            display: none;
        `;
        
        const form = document.querySelector('.reservation-form-container');
        if (form) {
            form.insertBefore(container, form.firstChild);
        }
        
        return container;
    }
    
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// ===== MÁSCARAS PARA TARJETA DE CRÉDITO =====
function setupCreditCardMasks() {
    const cardNumber = document.getElementById('card-number');
    const cardExpiry = document.getElementById('card-expiry');
    const cardCvv = document.getElementById('card-cvv');
    
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.substring(0, 16);
            
            // Formato: XXXX XXXX XXXX XXXX
            value = value.replace(/(\d{4})/g, '$1 ').trim();
            
            e.target.value = value;
        });
    }
    
    if (cardExpiry) {
        cardExpiry.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            
            e.target.value = value;
        });
    }
    
    if (cardCvv) {
        cardCvv.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.substring(0, 4);
            e.target.value = value;
        });
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar formulario de reserva si existe
    const reservationForm = document.querySelector('.reservation-form-container');
    if (reservationForm) {
        window.reservationForm = new ReservationForm();
        setupCreditCardMasks();
        
        // Cargar datos guardados si existen
        const savedData = sessionStorage.getItem('reservationData');
        if (savedData) {
            const data = JSON.parse(savedData);
            window.reservationForm.formData = data;
            
            // Rellenar campos con datos guardados
            Object.keys(data).forEach(key => {
                const input = document.getElementById(key);
                if (input && data[key]) {
                    input.value = data[key];
                }
            });
        }
    }
    
    // Configurar datepickers para todas las páginas
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) {
            if (input.id === 'check-in' || input.name === 'check_in') {
                input.value = today;
            }
            if (input.id === 'check-out' || input.name === 'check_out') {
                input.value = tomorrowStr;
            }
        }
    });
    
    // Función para calcular precio en tiempo real
    function calculateRealTimePrice() {
        const roomPrice = parseFloat(document.querySelector('.room-price')?.textContent?.replace(/[^0-9.]/g, '')) || 0;
        const checkIn = document.getElementById('check-in')?.value;
        const checkOut = document.getElementById('check-out')?.value;
        
        if (roomPrice > 0 && checkIn && checkOut) {
            const start = new Date(checkIn);
            const end = new Date(checkOut);
            const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            
            if (nights > 0) {
                const subtotal = roomPrice * nights;
                const taxes = subtotal * 0.15;
                const total = subtotal + taxes;
                
                return {
                    nights,
                    subtotal,
                    taxes,
                    total
                };
            }
        }
        
        return null;
    }
    
    // Actualizar precio cuando cambien las fechas
    document.getElementById('check-in')?.addEventListener('change', updatePriceDisplay);
    document.getElementById('check-out')?.addEventListener('change', updatePriceDisplay);
    
    function updatePriceDisplay() {
        const priceData = calculateRealTimePrice();
        if (priceData) {
            document.querySelectorAll('.real-time-price').forEach(el => {
                const priceType = el.dataset.priceType;
                if (priceType === 'nights') {
                    el.textContent = priceData.nights;
                } else if (priceType === 'subtotal') {
                    el.textContent = `$${priceData.subtotal.toFixed(2)}`;
                } else if (priceType === 'taxes') {
                    el.textContent = `$${priceData.taxes.toFixed(2)}`;
                } else if (priceType === 'total') {
                    el.textContent = `$${priceData.total.toFixed(2)}`;
                }
            });
        }
    }
    
    // Inicializar cálculo de precio
    updatePriceDisplay();
});