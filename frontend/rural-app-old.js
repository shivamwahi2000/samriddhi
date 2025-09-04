// Rural App JavaScript for Samriddhi Platform
let currentLanguage = 'hi';
let selectedUserType = null;
let otpData = null;
let resendCountdown = 0;

// API Base URL
const API_BASE = 'http://localhost:3001/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    createOTPInputs();
    updateLanguage();
});

// Language Toggle
function toggleLanguage() {
    currentLanguage = currentLanguage === 'hi' ? 'en' : 'hi';
    updateLanguage();
    document.documentElement.lang = currentLanguage;
}

function updateLanguage() {
    const elements = document.querySelectorAll('[data-hi][data-en]');
    elements.forEach(element => {
        const text = element.getAttribute(`data-${currentLanguage}`);
        if (text) {
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        }
    });
    
    document.getElementById('langText').textContent = 
        currentLanguage === 'hi' ? 'English' : 'हिंदी';
}

// User Type Selection
function selectUserType(type) {
    selectedUserType = type;
    showStep('phoneStep');
    
    // Show appropriate KYC fields and set required attributes correctly
    if (type === 'individual') {
        document.getElementById('individualFields').classList.remove('hidden');
        document.getElementById('shgFields').classList.add('hidden');
        
        // Make individual fields required
        document.querySelectorAll('#individualFields input, #individualFields select, #individualFields textarea').forEach(input => {
            input.required = true;
        });
        
        // Remove required from hidden SHG fields
        document.querySelectorAll('#shgFields input, #shgFields select, #shgFields textarea').forEach(input => {
            input.required = false;
        });
    } else {
        document.getElementById('individualFields').classList.add('hidden');
        document.getElementById('shgFields').classList.remove('hidden');
        
        // Make SHG fields required
        document.querySelectorAll('#shgFields input, #shgFields select, #shgFields textarea').forEach(input => {
            input.required = true;
        });
        
        // Remove required from hidden individual fields
        document.querySelectorAll('#individualFields input, #individualFields select, #individualFields textarea').forEach(input => {
            input.required = false;
        });
    }
}

// Step Navigation
function showStep(stepId) {
    const steps = ['userTypeStep', 'phoneStep', 'otpStep', 'kycStep', 'successStep'];
    steps.forEach(step => {
        document.getElementById(step).classList.add('hidden');
    });
    document.getElementById(stepId).classList.remove('hidden');
}

function goBack() {
    showStep('userTypeStep');
    clearError('phoneError');
}

// Error Handling
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.remove('hidden');
}

function clearError(elementId) {
    const element = document.getElementById(elementId);
    element.classList.add('hidden');
}

// Phone Number Validation
function validatePhone(phone) {
    return /^[6-9]\d{9}$/.test(phone);
}

// Send OTP
async function sendOTP(event) {
    event.preventDefault();
    
    const phoneInput = document.getElementById('phoneInput');
    const phone = phoneInput.value.trim();
    
    if (!validatePhone(phone)) {
        showError('phoneError', currentLanguage === 'hi' ? 
            'कृपया सही मोबाइल नंबर डालें (10 अंक)' : 
            'Please enter valid mobile number (10 digits)');
        return;
    }
    
    clearError('phoneError');
    
    const sendBtn = document.getElementById('sendOtpBtn');
    const originalText = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="loading"></span> ' + 
        (currentLanguage === 'hi' ? 'भेज रहे हैं...' : 'Sending...');
    
    try {
        const response = await fetch(`${API_BASE}/auth/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: `+91${phone}`,
                userType: selectedUserType
            }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            otpData = { phone: `+91${phone}`, userType: selectedUserType };
            document.getElementById('displayPhone').textContent = phone;
            showStep('otpStep');
            startResendCountdown();
        } else {
            showError('phoneError', data.message || 
                (currentLanguage === 'hi' ? 'OTP भेजने में समस्या' : 'Error sending OTP'));
        }
    } catch (error) {
        showError('phoneError', currentLanguage === 'hi' ? 
            'नेटवर्क की समस्या। दोबारा कोशिश करें।' : 
            'Network error. Please try again.');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = originalText;
    }
}

// Create OTP Input Fields
function createOTPInputs() {
    const container = document.getElementById('otpInputs');
    container.innerHTML = '';
    
    for (let i = 0; i < 6; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = '1';
        input.className = 'otp-input';
        input.setAttribute('data-index', i);
        
        input.addEventListener('input', handleOTPInput);
        input.addEventListener('keydown', handleOTPKeydown);
        input.addEventListener('paste', handleOTPPaste);
        
        container.appendChild(input);
    }
}

// OTP Input Handling
function handleOTPInput(event) {
    const input = event.target;
    const value = input.value;
    const index = parseInt(input.getAttribute('data-index'));
    
    if (value && /^\d$/.test(value)) {
        input.classList.add('filled');
        
        // Move to next input
        const nextInput = document.querySelector(`[data-index="${index + 1}"]`);
        if (nextInput) {
            nextInput.focus();
        }
        
        // Auto-verify when all 6 digits entered
        const allInputs = document.querySelectorAll('.otp-input');
        const otp = Array.from(allInputs).map(inp => inp.value).join('');
        if (otp.length === 6) {
            setTimeout(() => verifyOTP(), 500);
        }
    } else {
        input.value = '';
        input.classList.remove('filled');
    }
}

function handleOTPKeydown(event) {
    const input = event.target;
    const index = parseInt(input.getAttribute('data-index'));
    
    if (event.key === 'Backspace' && !input.value) {
        const prevInput = document.querySelector(`[data-index="${index - 1}"]`);
        if (prevInput) {
            prevInput.focus();
            prevInput.value = '';
            prevInput.classList.remove('filled');
        }
    }
}

function handleOTPPaste(event) {
    event.preventDefault();
    const paste = (event.clipboardData || window.clipboardData).getData('text');
    const digits = paste.replace(/\D/g, '').slice(0, 6);
    
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach((input, index) => {
        if (digits[index]) {
            input.value = digits[index];
            input.classList.add('filled');
        }
    });
    
    if (digits.length === 6) {
        setTimeout(() => verifyOTP(), 500);
    }
}

// Verify OTP
async function verifyOTP() {
    const inputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(inputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showError('otpError', currentLanguage === 'hi' ? 
            'पूरा OTP डालें' : 'Enter complete OTP');
        return;
    }
    
    clearError('otpError');
    
    const verifyBtn = document.getElementById('verifyBtn');
    const originalText = verifyBtn.textContent;
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span class="loading"></span> ' + 
        (currentLanguage === 'hi' ? 'सत्यापित कर रहे हैं...' : 'Verifying...');
    
    try {
        const response = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: otpData.phone,
                otp: otp,
                userType: otpData.userType
            }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStep('kycStep');
        } else {
            showError('otpError', data.message || 
                (currentLanguage === 'hi' ? 'गलत OTP' : 'Invalid OTP'));
            
            // Clear OTP inputs
            inputs.forEach(input => {
                input.value = '';
                input.classList.remove('filled');
            });
            inputs[0].focus();
        }
    } catch (error) {
        showError('otpError', currentLanguage === 'hi' ? 
            'नेटवर्क की समस्या। दोबारा कोशिश करें।' : 
            'Network error. Please try again.');
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = originalText;
    }
}

// Resend OTP
async function resendOTP() {
    if (resendCountdown > 0) return;
    
    const resendBtn = document.getElementById('resendBtn');
    resendBtn.disabled = true;
    resendBtn.textContent = currentLanguage === 'hi' ? 'भेज रहे हैं...' : 'Sending...';
    
    try {
        const response = await fetch(`${API_BASE}/auth/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: otpData.phone,
                userType: otpData.userType
            }),
        });
        
        if (response.ok) {
            startResendCountdown();
            clearError('otpError');
        } else {
            const data = await response.json();
            showError('otpError', data.message || 
                (currentLanguage === 'hi' ? 'OTP भेजने में समस्या' : 'Error sending OTP'));
        }
    } catch (error) {
        showError('otpError', currentLanguage === 'hi' ? 
            'नेटवर्क की समस्या' : 'Network error');
    } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = currentLanguage === 'hi' ? 'दोबारा भेजें' : 'Resend';
    }
}

function startResendCountdown() {
    resendCountdown = 30;
    const resendBtn = document.getElementById('resendBtn');
    const countdownEl = document.getElementById('countdown');
    
    resendBtn.classList.add('hidden');
    countdownEl.classList.remove('hidden');
    
    const interval = setInterval(() => {
        countdownEl.textContent = currentLanguage === 'hi' ? 
            `${resendCountdown} सेकंड में दोबारा भेज सकते हैं` : 
            `Resend in ${resendCountdown} seconds`;
        
        resendCountdown--;
        
        if (resendCountdown < 0) {
            clearInterval(interval);
            resendBtn.classList.remove('hidden');
            countdownEl.classList.add('hidden');
        }
    }, 1000);
}

// KYC Form Submission
async function submitKYC(event) {
    event.preventDefault();
    
    const form = document.getElementById('kycForm');
    const kycData = {};
    
    // Get visible form inputs only
    const visibleSection = selectedUserType === 'individual' ? 
        document.getElementById('individualFields') : 
        document.getElementById('shgFields');
    
    const inputs = visibleSection.querySelectorAll('input, select, textarea');
    let hasEmptyFields = false;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            hasEmptyFields = true;
            input.style.borderColor = '#dc2626';
        } else {
            input.style.borderColor = '#d1d5db';
            kycData[input.name] = input.value.trim();
        }
    });
    
    if (hasEmptyFields) {
        alert(currentLanguage === 'hi' ? 
            'कृपया सभी फील्ड भरें' : 
            'Please fill all fields');
        return;
    }
    
    // Add user type and phone
    kycData.userType = selectedUserType;
    kycData.phone = otpData.phone;
    
    console.log('KYC Data:', kycData);
    
    const submitBtn = document.getElementById('kycBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> ' + 
        (currentLanguage === 'hi' ? 'खाता बना रहे हैं...' : 'Creating Account...');
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(kycData),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStep('successStep');
            // Store user data locally for rural users
            localStorage.setItem('samriddhiUser', JSON.stringify({
                phone: otpData.phone,
                userType: selectedUserType,
                token: data.token
            }));
        } else {
            alert(data.message || 
                (currentLanguage === 'hi' ? 'खाता बनाने में समस्या' : 'Error creating account'));
        }
    } catch (error) {
        alert(currentLanguage === 'hi' ? 
            'नेटवर्क की समस्या। दोबारा कोशिश करें।' : 
            'Network error. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Dashboard Navigation
function goToDashboard() {
    // Simple redirect to dashboard or show investment options
    alert(currentLanguage === 'hi' ? 
        'डैशबोर्ड खुल रहा है...' : 
        'Opening dashboard...');
    
    // In a real app, this would navigate to dashboard
    // For demo purposes, just show a success message
    window.location.href = '#dashboard';
}

// PWA Installation
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install prompt for rural users
    const installBtn = document.createElement('button');
    installBtn.textContent = currentLanguage === 'hi' ? 
        'फोन में इंस्टॉल करें' : 'Install on Phone';
    installBtn.className = 'btn btn-secondary';
    installBtn.style.marginTop = '15px';
    
    installBtn.onclick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            installBtn.style.display = 'none';
        }
    };
    
    document.querySelector('.header').appendChild(installBtn);
});

// Offline Support
window.addEventListener('online', () => {
    console.log('Back online');
});

window.addEventListener('offline', () => {
    console.log('Gone offline');
    alert(currentLanguage === 'hi' ? 
        'इंटरनेट कनेक्शन नहीं है। कृपया बाद में कोशिश करें।' : 
        'No internet connection. Please try again later.');
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then((registration) => {
            console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
        });
}

// Add form validation helpers
document.addEventListener('DOMContentLoaded', function() {
    // Add name attributes to form fields for proper data collection
    const kycForm = document.getElementById('kycForm');
    
    // Individual fields
    const individualInputs = [
        { selector: '#individualFields input[type="text"]', name: 'fullName' },
        { selector: '#individualFields input[type="date"]', name: 'dateOfBirth' },
        { selector: '#individualFields select', name: 'gender' },
        { selector: '#individualFields input[type="email"]', name: 'email' },
        { selector: '#individualFields textarea', name: 'address' },
        { selector: '#individualFields input[placeholder="123456"]', name: 'pinCode' },
        { selector: '#individualFields input[placeholder="ABCDE1234F"]', name: 'panNumber' },
        { selector: '#individualFields input[placeholder="1234 5678 9012"]', name: 'aadhaarNumber' }
    ];
    
    // SHG fields
    const shgInputs = [
        { selector: '#shgFields input[placeholder*="स्वयं सहायता"]', name: 'shgName' },
        { selector: '#shgFields input[placeholder="SHG/2024/001"]', name: 'registrationNumber' },
        { selector: '#shgFields input[type="number"]', name: 'memberCount' },
        { selector: '#shgFields input[placeholder*="अधिकृत व्यक्ति"]', name: 'authorizedPerson' },
        { selector: '#shgFields input[placeholder="shg@example.com"]', name: 'shgEmail' },
        { selector: '#shgFields input[placeholder="ABCDE1234F"]', name: 'shgPan' }
    ];
    
    // Set name attributes
    [...individualInputs, ...shgInputs].forEach(({ selector, name }) => {
        const element = document.querySelector(selector);
        if (element) {
            element.name = name;
        }
    });
});