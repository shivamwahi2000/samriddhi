let currentLanguage = 'hi';
let selectedUserType = null;
let otpData = null;
let resendCountdown = 0;
let isSignIn = false;

const API_BASE = 'https://your-backend-url.com/api';

document.addEventListener('DOMContentLoaded', function() {
    createOTPInputs();
    createPINInputs();
    updateLanguage();
    
    
    checkExistingUser();
});

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
    
    // Update chatbot questions when language changes
    const questionBtns = document.querySelectorAll('.question-btn');
    questionBtns.forEach(btn => {
        const text = btn.getAttribute(`data-${currentLanguage}`);
        if (text) {
            btn.textContent = text;
        }
    });
}

function checkExistingUser() {
    const existingUser = localStorage.getItem('samriddhiUser');
    if (existingUser) {
        const userData = JSON.parse(existingUser);
        showUserInfo(userData.phone);
        showStep('dashboardStep');
        loadPortfolio();
    } else {
        showStep('authTypeStep');
    }
}

function showUserInfo(phone) {
    const userInfo = document.getElementById('userInfo');
    const userPhone = document.getElementById('userPhone');
    
    userPhone.textContent = phone.replace('+91', '+91 ');
    userInfo.classList.remove('hidden');
}

function logout() {
    localStorage.removeItem('samriddhiUser');
    document.getElementById('userInfo').classList.add('hidden');
    isSignIn = false;
    selectedUserType = null;
    otpData = null;
    
    // Clear all inputs
    document.getElementById('phoneInput').value = '';
    document.querySelectorAll('.otp-input').forEach(input => {
        input.value = '';
        input.classList.remove('filled');
    });
    
    // Clear PIN inputs and hide PIN section
    document.querySelectorAll('.pin-input').forEach(input => {
        input.value = '';
        input.classList.remove('filled');
    });
    document.getElementById('pinSection').classList.add('hidden');
    
    showStep('authTypeStep');
}

function showSignIn() {
    isSignIn = true;
    updatePhoneStepForSignIn();
    showStep('phoneStep');
}

function showSignUp() {
    isSignIn = false;
    showStep('userTypeStep');
}

function goBackToAuth() {
    showStep('authTypeStep');
}

function updatePhoneStepForSignIn() {
    const title = document.getElementById('phoneStepTitle');
    if (title) {
        title.setAttribute('data-hi', 'साइन इन करें');
        title.setAttribute('data-en', 'Sign In');
        updateLanguage();
    }
}

function selectUserType(type) {
    selectedUserType = type;
    showStep('phoneStep');
}

function showStep(stepId) {
    const steps = ['authTypeStep', 'userTypeStep', 'phoneStep', 'otpStep', 'individualKYC', 'shgKYC', 'successStep', 'dashboardStep', 'investmentStep', 'profileStep'];
    steps.forEach(step => {
        document.getElementById(step).classList.add('hidden');
    });
    document.getElementById(stepId).classList.remove('hidden');
    
    // Load portfolio when dashboard is shown
    if (stepId === 'dashboardStep') {
        loadPortfolio();
    }
    
    // Load profile when profile is shown
    if (stepId === 'profileStep') {
        loadProfile();
    }
}

function goBack() {
    if (isSignIn) {
        showStep('authTypeStep');
    } else {
        showStep('userTypeStep');
    }
    clearError('phoneError');
}

function goBackFromKYC() {
    showStep('otpStep');
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.remove('hidden');
}

function clearError(elementId) {
    const element = document.getElementById(elementId);
    element.classList.add('hidden');
}

function validatePhone(phone) {
    return /^[6-9]\d{9}$/.test(phone);
}

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
                userType: selectedUserType || 'individual'
            }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            otpData = { phone: `+91${phone}`, userType: selectedUserType };
            document.getElementById('displayPhone').textContent = phone;
            showStep('otpStep');
            startResendCountdown();
            
            // For sign in, always show PIN section
            if (isSignIn) {
                setTimeout(() => {
                    showPINSection();
                }, 500);
            }
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

function createPINInputs() {
    const container = document.getElementById('pinInputs');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < 4; i++) {
        const input = document.createElement('input');
        input.type = 'password';
        input.maxLength = '1';
        input.className = 'pin-input';
        input.setAttribute('data-index', i);
        
        input.addEventListener('input', handlePINInput);
        input.addEventListener('keydown', handlePINKeydown);
        
        container.appendChild(input);
    }
}

function handleOTPInput(event) {
    const input = event.target;
    const value = input.value;
    const index = parseInt(input.getAttribute('data-index'));
    
    if (value && /^\d$/.test(value)) {
        input.classList.add('filled');
        
        const nextInput = document.querySelector(`[data-index="${index + 1}"]`);
        if (nextInput) {
            nextInput.focus();
        }
        
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

function handlePINInput(event) {
    const input = event.target;
    const value = input.value;
    const index = parseInt(input.getAttribute('data-index'));
    
    if (value && /^\d$/.test(value)) {
        input.classList.add('filled');
        
        const nextInput = document.querySelector(`.pin-input[data-index="${index + 1}"]`);
        if (nextInput) {
            nextInput.focus();
        }
    } else {
        input.value = '';
        input.classList.remove('filled');
    }
}

function handlePINKeydown(event) {
    const input = event.target;
    const index = parseInt(input.getAttribute('data-index'));
    
    if (event.key === 'Backspace' && !input.value) {
        const prevInput = document.querySelector(`.pin-input[data-index="${index - 1}"]`);
        if (prevInput) {
            prevInput.focus();
            prevInput.value = '';
            prevInput.classList.remove('filled');
        }
    }
}

async function verifyOTP() {
    const inputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(inputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showError('otpError', currentLanguage === 'hi' ? 
            'पूरा OTP डालें' : 'Enter complete OTP');
        return;
    }
    
    // For sign in, also check PIN if visible
    let pin = null;
    if (isSignIn && !document.getElementById('pinSection').classList.contains('hidden')) {
        const pinInputs = document.querySelectorAll('.pin-input');
        pin = Array.from(pinInputs).map(input => input.value).join('');
        
        if (pin.length !== 4) {
            showError('otpError', currentLanguage === 'hi' ? 
                'पूरा PIN डालें' : 'Enter complete PIN');
            return;
        }
    }
    
    clearError('otpError');
    
    const verifyBtn = document.getElementById('verifyBtn');
    const originalText = verifyBtn.textContent;
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span class="loading"></span> ' + 
        (currentLanguage === 'hi' ? 'सत्यापित कर रहे हैं...' : 'Verifying...');
    
    try {
        const endpoint = isSignIn ? 'login' : 'verify-otp';
        const requestBody = {
            phone: otpData.phone,
            otp: otp,
            userType: otpData.userType
        };
        
        if (pin) {
            requestBody.pin = pin;
        }
        
        const response = await fetch(`${API_BASE}/auth/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (isSignIn) {
                // For sign in, store user data and go to dashboard
                console.log('Login response data:', data);
                localStorage.setItem('samriddhiUser', JSON.stringify({
                    phone: otpData.phone,
                    userType: data.userType || 'individual',
                    token: data.token || data.accessToken
                }));
                showUserInfo(otpData.phone);
                showStep('dashboardStep');
            } else {
                // For sign up, show appropriate KYC form based on user type
                if (selectedUserType === 'individual') {
                    showStep('individualKYC');
                } else {
                    showStep('shgKYC');
                }
            }
        } else {
            // Check if PIN is required for this user
            if (data.error === 'PIN is required') {
                showPINSection();
                showError('otpError', currentLanguage === 'hi' ? 
                    'PIN डालें' : 'Enter PIN');
            } else {
                showError('otpError', data.error || 
                    (currentLanguage === 'hi' ? 'गलत OTP या PIN' : 'Invalid OTP or PIN'));
                
                inputs.forEach(input => {
                    input.value = '';
                    input.classList.remove('filled');
                });
                
                // Clear PIN inputs if visible
                if (pin) {
                    document.querySelectorAll('.pin-input').forEach(input => {
                        input.value = '';
                        input.classList.remove('filled');
                    });
                }
                
                inputs[0].focus();
            }
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

function showPINSection() {
    document.getElementById('pinSection').classList.remove('hidden');
    createPINInputs();
    updateLanguage();
}

async function checkIfPINRequired(phone) {
    try {
        const response = await fetch(`${API_BASE}/auth/check-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone }),
        });
        
        const data = await response.json();
        
        if (data.hasPin) {
            showPINSection();
        }
    } catch (error) {
        console.log('Could not check PIN requirement:', error);
    }
}

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

// Individual KYC Submission
async function submitIndividualKYC(event) {
    event.preventDefault();
    
    const form = document.getElementById('individualForm');
    const kycData = {};
    
    const inputs = form.querySelectorAll('input, select, textarea');
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
    
    kycData.userType = 'individual';
    kycData.phone = otpData.phone;
    
    await submitKYCData(kycData);
}

// SHG KYC Submission
async function submitSHGKYC(event) {
    event.preventDefault();
    
    const form = document.getElementById('shgForm');
    const kycData = {};
    
    const inputs = form.querySelectorAll('input, select, textarea');
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
    
    kycData.userType = 'shg';
    kycData.phone = otpData.phone;
    
    await submitKYCData(kycData);
}

// Common KYC submission
async function submitKYCData(kycData) {
    const submitBtn = selectedUserType === 'individual' ? 
        document.querySelector('#individualForm button[type="submit"]') :
        document.querySelector('#shgForm button[type="submit"]');
    
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
        
        console.log('Registration response:', response.status, data);
        
        if (response.ok) {
            localStorage.setItem('samriddhiUser', JSON.stringify({
                phone: otpData.phone,
                userType: selectedUserType,
                token: data.token
            }));
            showUserInfo(otpData.phone);
            showStep('successStep');
        } else {
            alert(data.error || data.message || 
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

function goToDashboard() {
    showStep('dashboardStep');
    loadPortfolio();
}

async function loadPortfolio() {
    const user = JSON.parse(localStorage.getItem('samriddhiUser') || '{}');
    console.log('Loading portfolio for user:', user);
    
    if (!user.token) {
        console.log('No token found, showing empty portfolio');
        displayEmptyPortfolio();
        return;
    }
    
    try {
        console.log('Making portfolio request with token:', user.token);
        const response = await fetch(`${API_BASE}/portfolio`, {
            headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json',
            },
        });
        
        console.log('Portfolio response status:', response.status);
        
        if (response.ok) {
            const portfolio = await response.json();
            console.log('Portfolio data:', portfolio);
            displayPortfolio(portfolio);
        } else {
            const errorData = await response.json();
            console.log('Portfolio error:', errorData);
            displayEmptyPortfolio();
        }
    } catch (error) {
        console.error('Portfolio load error:', error);
        displayEmptyPortfolio();
    }
}

function displayPortfolio(portfolio) {
    const content = document.getElementById('portfolioContent');
    
    if (!portfolio.holdings || portfolio.holdings.length === 0) {
        displayEmptyPortfolio();
        return;
    }
    
    const totalInvested = portfolio.totalInvested || 0;
    const currentValue = portfolio.currentValue || 0;
    const profit = currentValue - totalInvested;
    const profitPercentage = totalInvested > 0 ? ((profit / totalInvested) * 100).toFixed(1) : 0;
    
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div style="text-align: center; background: white; padding: 1rem; border-radius: 12px; border: 2px solid #134e4a;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #134e4a;">₹${totalInvested.toLocaleString()}</div>
                <div style="font-size: 0.875rem; color: #6b7280;" data-hi="कुल निवेश" data-en="Total Invested">${currentLanguage === 'hi' ? 'कुल निवेश' : 'Total Invested'}</div>
            </div>
            <div style="text-align: center; background: white; padding: 1rem; border-radius: 12px; border: 2px solid #059669;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #059669;">₹${currentValue.toLocaleString()}</div>
                <div style="font-size: 0.875rem; color: #6b7280;" data-hi="वर्तमान मूल्य" data-en="Current Value">${currentLanguage === 'hi' ? 'वर्तमान मूल्य' : 'Current Value'}</div>
            </div>
            <div style="text-align: center; background: white; padding: 1rem; border-radius: 12px; border: 2px solid #d97706;">
                <div style="font-size: 1.5rem; font-weight: 700; color: ${profit >= 0 ? '#059669' : '#dc2626'};">₹${profit.toLocaleString()}</div>
                <div style="font-size: 0.875rem; color: #6b7280;" data-hi="फायदा/नुकसान" data-en="Profit/Loss">${currentLanguage === 'hi' ? 'फायदा/नुकसान' : 'Profit/Loss'}</div>
                <div style="font-size: 0.75rem; color: ${profit >= 0 ? '#059669' : '#dc2626'};">(${profit >= 0 ? '+' : ''}${profitPercentage}%)</div>
            </div>
        </div>
        
        <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: #134e4a;" 
            data-hi="📊 निवेश विवरण:" data-en="📊 Investment Details:">${currentLanguage === 'hi' ? '📊 निवेश विवरण:' : '📊 Investment Details:'}</h4>
        
        <div style="background: white; border-radius: 12px; padding: 1rem;">
            ${portfolio.holdings.map(holding => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6;">
                    <div>
                        <div style="font-weight: 600; color: #134e4a;">${holding.bondName}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${currentLanguage === 'hi' ? 'खरीदा' : 'Purchased'}: ${new Date(holding.purchaseDate).toLocaleDateString()}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600;">₹${holding.currentValue.toLocaleString()}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">₹${holding.totalInvested.toLocaleString()} ${currentLanguage === 'hi' ? 'से' : 'from'}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function displayEmptyPortfolio() {
    const content = document.getElementById('portfolioContent');
    content.innerHTML = `
        <div style="text-align: center; color: #6b7280;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📈</div>
            <div style="font-size: 0.875rem;" 
                 data-hi="निवेश शुरू करने के लिए नीचे बॉन्ड चुनें" data-en="Choose bonds below to start investing">${currentLanguage === 'hi' ? 'निवेश शुरू करने के लिए नीचे बॉन्ड चुनें' : 'Choose bonds below to start investing'}</div>
        </div>
    `;
}

let selectedBond = null;

function selectBond(bondId, returnRate, years) {
    selectedBond = { bondId, returnRate, years };
    
    // Show bond info
    const bondNames = {
        'tata-3yr': currentLanguage === 'hi' ? '🏭 टाटा पावर बॉन्ड (3 साल)' : '🏭 Tata Power Bond (3 Years)',
        'ril-5yr': currentLanguage === 'hi' ? '⚡ रिलायंस इंडस्ट्रीज बॉन्ड (5 साल)' : '⚡ Reliance Industries Bond (5 Years)',
        'hdfc-2yr': currentLanguage === 'hi' ? '🏦 HDFC बैंक FD (2 साल)' : '🏦 HDFC Bank FD (2 Years)'
    };
    
    document.getElementById('selectedBondInfo').innerHTML = `
        <h3 style="font-weight: 700; margin-bottom: 8px;">${bondNames[bondId]}</h3>
        <div style="font-size: 14px; color: #6b7280;">
            ${currentLanguage === 'hi' ? 'रिटर्न' : 'Return'}: <strong>${returnRate}%</strong> • 
            ${currentLanguage === 'hi' ? 'अवधि' : 'Period'}: <strong>${years} ${currentLanguage === 'hi' ? 'साल' : 'years'}</strong>
        </div>
    `;
    
    showStep('investmentStep');
}

let selectedAmount = null;

function selectAmount(amount) {
    selectedAmount = amount;
    document.getElementById('customAmount').value = amount;
    
    // Highlight selected button
    document.querySelectorAll('#investmentStep .btn-secondary').forEach(btn => {
        btn.style.background = 'white';
        btn.style.borderColor = '#d1d5db';
    });
    event.target.style.background = '#fef3c7';
    event.target.style.borderColor = '#d97706';
    
    updateInvestmentSummary();
}

function updateInvestmentSummary() {
    const amount = selectedAmount || document.getElementById('customAmount').value;
    if (amount && selectedBond) {
        const maturityAmount = Math.round(amount * (1 + selectedBond.returnRate/100) ** selectedBond.years);
        const profit = maturityAmount - amount;
        
        document.getElementById('investBtn').innerHTML = `
            ${currentLanguage === 'hi' ? 'निवेश करें' : 'Invest'} ₹${amount} 
            <div style="font-size: 12px; font-weight: normal;">
                ${currentLanguage === 'hi' ? 'मिलेगा' : 'Returns'}: ₹${maturityAmount} 
                (${currentLanguage === 'hi' ? 'फायदा' : 'Profit'}: ₹${profit})
            </div>
        `;
    }
}

function proceedInvestment() {
    const amount = selectedAmount || document.getElementById('customAmount').value;
    if (!amount || amount < 100) {
        alert(currentLanguage === 'hi' ? 
            'कम से कम ₹100 निवेश करें' : 
            'Minimum investment ₹100');
        return;
    }
    
    alert(currentLanguage === 'hi' ? 
        `₹${amount} का निवेश सफल! आपको SMS मिलेगा।` : 
        `₹${amount} investment successful! You will receive SMS.`);
    
    showStep('dashboardStep');
}

// Chatbot Functions
function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbotWindow');
    const isVisible = chatbotWindow.style.display === 'flex';
    
    if (isVisible) {
        chatbotWindow.style.display = 'none';
    } else {
        chatbotWindow.style.display = 'flex';
        // Reset to questions view
        backToQuestions();
    }
}

function showAnswer(questionType) {
    const answers = {
        'investment': {
            hi: `🌱 <strong>निवेश करना बहुत आसान है:</strong><br><br>
            1️⃣ अपना मोबाइल नंबर डालें<br>
            2️⃣ WhatsApp पर OTP मिलेगा<br> 
            3️⃣ बॉन्ड चुनें (टाटा, रिलायंस, HDFC)<br>
            4️⃣ राशि चुनें (₹100 से शुरू)<br>
            5️⃣ निवेश पूरा करें<br><br>
            💡 <strong>टिप:</strong> कम राशि से शुरू करें!`,
            en: `🌱 <strong>Investing is very easy:</strong><br><br>
            1️⃣ Enter your mobile number<br>
            2️⃣ Get OTP on WhatsApp<br>
            3️⃣ Choose bond (Tata, Reliance, HDFC)<br>
            4️⃣ Select amount (Start from ₹100)<br>
            5️⃣ Complete investment<br><br>
            💡 <strong>Tip:</strong> Start with small amount!`
        },
        'safety': {
            hi: `🛡️ <strong>100% सुरक्षित है:</strong><br><br>
            ✅ SEBI रजिस्टर्ड प्लेटफॉर्म<br>
            ✅ सरकारी मान्यता प्राप्त<br>
            ✅ AAA रेटेड बॉन्ड्स<br>
            ✅ बैंक-लेवल सिक्योरिटी<br>
            ✅ KYC वेरिफिकेशन<br><br>
            💰 आपका पैसा 100% सुरक्षित है!`,
            en: `🛡️ <strong>100% Safe & Secure:</strong><br><br>
            ✅ SEBI Registered Platform<br>
            ✅ Government Approved<br>
            ✅ AAA Rated Bonds<br>
            ✅ Bank-level Security<br>
            ✅ KYC Verification<br><br>
            💰 Your money is 100% safe!`
        },
        'returns': {
            hi: `💰 <strong>रिटर्न कैसे मिलता है:</strong><br><br>
            📊 <strong>टाटा पावर:</strong> 8.75% (3 साल)<br>
            📊 <strong>रिलायंस:</strong> 9.50% (5 साल)<br>
            📊 <strong>HDFC FD:</strong> 7.25% (2 साल)<br><br>
            🔄 हर महीने ब्याज मिलता है<br>
            💸 मेच्योरिटी पर पूरा पैसा<br>
            📱 SMS अपडेट मिलते रहेंगे`,
            en: `💰 <strong>How Returns Work:</strong><br><br>
            📊 <strong>Tata Power:</strong> 8.75% (3 years)<br>
            📊 <strong>Reliance:</strong> 9.50% (5 years)<br>
            📊 <strong>HDFC FD:</strong> 7.25% (2 years)<br><br>
            🔄 Monthly interest payments<br>
            💸 Full amount at maturity<br>
            📱 Regular SMS updates`
        },
        'kyc': {
            hi: `📄 <strong>KYC क्यों जरूरी है:</strong><br><br>
            🏛️ SEBI का नियम है<br>
            🛡️ आपकी सुरक्षा के लिए<br>
            💳 बैंक अकाउंट जोड़ने के लिए<br>
            📊 टैक्स रिपोर्टिंग के लिए<br><br>
            📋 <strong>चाहिए:</strong> नाम, पता, PAN, आधार<br>
            ⏱️ केवल 2 मिनट लगते हैं!`,
            en: `📄 <strong>Why KYC is Required:</strong><br><br>
            🏛️ SEBI regulation<br>
            🛡️ For your security<br>
            💳 To link bank account<br>
            📊 For tax reporting<br><br>
            📋 <strong>Need:</strong> Name, address, PAN, Aadhaar<br>
            ⏱️ Takes only 2 minutes!`
        },
        'withdraw': {
            hi: `💸 <strong>पैसा निकालना:</strong><br><br>
            🗓️ मेच्योरिटी डेट पर ऑटो क्रेडिट<br>
            🏦 आपके बैंक अकाउंट में<br>
            📱 SMS नोटिफिकेशन मिलेगा<br>
            💰 प्रिंसिपल + ब्याज मिलेगा<br><br>
            ⚠️ <strong>नोट:</strong> समय से पहले निकालने पर<br>
            पेनल्टी हो सकती है`,
            en: `💸 <strong>Money Withdrawal:</strong><br><br>
            🗓️ Auto credit on maturity date<br>
            🏦 To your bank account<br>
            📱 SMS notification<br>
            💰 Principal + Interest<br><br>
            ⚠️ <strong>Note:</strong> Early withdrawal may<br>
            have penalty charges`
        },
        'support': {
            hi: `🆘 <strong>सहायता पाएं:</strong><br><br>
            📞 <strong>हेल्पलाइन:</strong> 1800-123-4567<br>
            💬 <strong>WhatsApp:</strong> +91-98765-43210<br>
            📧 <strong>ईमेल:</strong> help@samriddhi.com<br>
            🕐 <strong>समय:</strong> सुबह 9 से शाम 6<br><br>
            🗣️ हिंदी और अंग्रेजी में सपोर्ट<br>
            ⚡ तुरंत जवाब मिलता है!`,
            en: `🆘 <strong>Get Support:</strong><br><br>
            📞 <strong>Helpline:</strong> 1800-123-4567<br>
            💬 <strong>WhatsApp:</strong> +91-98765-43210<br>
            📧 <strong>Email:</strong> help@samriddhi.com<br>
            🕐 <strong>Time:</strong> 9 AM to 6 PM<br><br>
            🗣️ Hindi and English support<br>
            ⚡ Instant response!`
        }
    };
    
    const answer = answers[questionType];
    const content = answer[currentLanguage];
    
    document.getElementById('answerContent').innerHTML = content;
    document.getElementById('questionsView').style.display = 'none';
    document.getElementById('answerView').style.display = 'block';
}

function backToQuestions() {
    document.getElementById('answerView').style.display = 'none';
    document.getElementById('questionsView').style.display = 'block';
}

function showProfile() {
    showStep('profileStep');
    loadProfile();
}

async function loadProfile() {
    const user = JSON.parse(localStorage.getItem('samriddhiUser') || '{}');
    
    if (!user.token) {
        document.getElementById('profileContent').innerHTML = `
            <div style="text-align: center; color: #dc2626;">
                <div style="font-size: 1.125rem; font-weight: 600;">Login Required</div>
            </div>
        `;
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json',
            },
        });
        
        if (response.ok) {
            const profileData = await response.json();
            displayProfile(profileData);
        } else {
            displayProfileError();
        }
    } catch (error) {
        console.error('Profile load error:', error);
        displayProfileError();
    }
}

function displayProfile(profile) {
    const content = document.getElementById('profileContent');
    
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #134e4a; margin-bottom: 1rem;" 
                    data-hi="व्यक्तिगत जानकारी" data-en="Personal Information">${currentLanguage === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Information'}</h3>
                
                <div style="background: white; border-radius: 12px; padding: 1.5rem;">
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;" data-hi="नाम" data-en="Name">${currentLanguage === 'hi' ? 'नाम' : 'Name'}</div>
                        <div style="font-weight: 600; color: #134e4a;">${profile.name}</div>
                        ${profile.nameHindi ? `<div style="font-size: 0.875rem; color: #6b7280;">${profile.nameHindi}</div>` : ''}
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;" data-hi="फोन नंबर" data-en="Phone">${currentLanguage === 'hi' ? 'फोन नंबर' : 'Phone'}</div>
                        <div style="font-weight: 600;">${profile.phone}</div>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;" data-hi="ईमेल" data-en="Email">${currentLanguage === 'hi' ? 'ईमेल' : 'Email'}</div>
                        <div style="font-weight: 600;">${profile.email || 'Not provided'}</div>
                    </div>
                    
                    <div>
                        <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;" data-hi="उपयोगकर्ता प्रकार" data-en="User Type">${currentLanguage === 'hi' ? 'उपयोगकर्ता प्रकार' : 'User Type'}</div>
                        <div style="font-weight: 600; text-transform: capitalize;">${profile.userType === 'individual' ? (currentLanguage === 'hi' ? 'व्यक्तिगत' : 'Individual') : (currentLanguage === 'hi' ? 'स्वयं सहायता समूह' : 'Self Help Group')}</div>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #134e4a; margin-bottom: 1rem;" 
                    data-hi="खाता स्थिति" data-en="Account Status">${currentLanguage === 'hi' ? 'खाता स्थिति' : 'Account Status'}</h3>
                
                <div style="background: white; border-radius: 12px; padding: 1.5rem;">
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;" data-hi="KYC स्थिति" data-en="KYC Status">${currentLanguage === 'hi' ? 'KYC स्थिति' : 'KYC Status'}</div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${profile.kycStatus === 'completed' ? '#059669' : '#d97706'};"></span>
                            <span style="font-weight: 600; color: ${profile.kycStatus === 'completed' ? '#059669' : '#d97706'};">
                                ${profile.kycStatus === 'completed' ? (currentLanguage === 'hi' ? 'पूर्ण' : 'Completed') : (currentLanguage === 'hi' ? 'लंबित' : 'Pending')}
                            </span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;" data-hi="सदस्य बने" data-en="Member Since">${currentLanguage === 'hi' ? 'सदस्य बने' : 'Member Since'}</div>
                        <div style="font-weight: 600;">${new Date(profile.createdAt).toLocaleDateString()}</div>
                    </div>
                    
                    <div>
                        <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;" data-hi="भाषा प्राथमिकता" data-en="Language">${currentLanguage === 'hi' ? 'भाषा प्राथमिकता' : 'Language'}</div>
                        <div style="font-weight: 600;">${profile.languagePreference === 'hi' ? 'हिंदी' : 'English'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function displayProfileError() {
    const content = document.getElementById('profileContent');
    content.innerHTML = `
        <div style="text-align: center; color: #dc2626;">
            <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;" 
                 data-hi="प्रोफाइल लोड नहीं हो सका" data-en="Could not load profile">${currentLanguage === 'hi' ? 'प्रोफाइल लोड नहीं हो सका' : 'Could not load profile'}</div>
        </div>
    `;
}