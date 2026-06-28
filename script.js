document.addEventListener('DOMContentLoaded', () => {
    const appointmentForm = document.getElementById('appointmentForm');
    const billForm = document.getElementById('billForm');
    const modal = document.getElementById('successModal');
    const closeButtons = document.querySelectorAll('.close-button, .modal-close');
    const searchInput = document.getElementById('careSearch');
    const searchButton = document.getElementById('searchButton');
    const searchFeedback = document.getElementById('searchFeedback');
    const appointmentDate = document.getElementById('appointmentDate');
    const paymentAmount = document.getElementById('paymentAmount');
    const payButton = document.getElementById('payButton');
    const billPayButton = document.getElementById('billPayButton');
    const cardMatchError = document.getElementById('cardMatchError');
    const billCardMatchError = document.getElementById('billCardMatchError');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const supportCall = document.getElementById('supportCall');
    const tabButtons = document.querySelectorAll('.tab-button');
    let isPaymentFailureLocked = false;

    const careTopics = {
        cardiology: 'Cardiology includes heart rhythm concerns, valve care, imaging, and second opinions.',
        cancer: 'Cancer Care pathways can include diagnosis review, oncology visits, and treatment planning.',
        oncology: 'Cancer Care pathways can include diagnosis review, oncology visits, and treatment planning.',
        neurology: 'Neurology covers headaches, movement disorders, stroke follow-up, and complex diagnostics.',
        orthopedic: 'Orthopedics includes joint pain, sports injuries, spine care, and surgical consultations.',
        executive: 'Executive Health focuses on preventive screenings and coordinated visit planning.'
    };

    function setInvalid(field, invalid) {
        field.style.borderColor = invalid ? '#b42318' : '#bdc9d8';
        field.setAttribute('aria-invalid', String(invalid));
    }

    function showModal(title = 'Payment Failed', message = 'We could not complete your payment. Please call support for help.', isFailure = true) {
        isPaymentFailureLocked = isFailure;
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        if (supportCall) {
            supportCall.setAttribute('href', 'tel:+15075550170');
        }
        modal.classList.add('is-visible');
        modal.querySelector('.modal-content').focus();
    }

    function hideModal() {
        if (isPaymentFailureLocked) {
            return;
        }

        modal.classList.remove('is-visible');
    }

    function onlyDigits(value) {
        return value.replace(/\D/g, '');
    }

    function formatCard(value) {
        return onlyDigits(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    function formatDate(value, maxLength) {
        const digits = onlyDigits(value).slice(0, maxLength);
        if (digits.length <= 2) {
            return digits;
        }
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    function validatePattern(id, regex) {
        const field = document.getElementById(id);
        const valid = regex.test(field.value.trim());
        setInvalid(field, !valid);
        return valid;
    }

    function validateCardMatch() {
        const cardNumber = document.getElementById('cardNumber');
        const confirmCardNumber = document.getElementById('confirmCardNumber');
        const matches = onlyDigits(cardNumber.value) === onlyDigits(confirmCardNumber.value);

        setInvalid(confirmCardNumber, !matches);
        cardMatchError.textContent = matches ? '' : 'Card numbers do not match. Please re-enter the card number.';
        return matches;
    }

    function validateBillCardMatch() {
        const cardNumber = document.getElementById('billCardNumber');
        const confirmCardNumber = document.getElementById('billConfirmCardNumber');
        const matches = onlyDigits(cardNumber.value) === onlyDigits(confirmCardNumber.value);

        setInvalid(confirmCardNumber, !matches);
        billCardMatchError.textContent = matches ? '' : 'Card numbers do not match. Please re-enter the card number.';
        return matches;
    }

    function validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');

        requiredFields.forEach((field) => {
            const empty = !field.value.trim();
            setInvalid(field, empty);
            if (empty) {
                isValid = false;
            }
        });

        const checks = [];

        if (form === appointmentForm) {
            checks.push(validatePattern('cardNumber', /^(\d{4}\s){3}\d{4}$/));
            checks.push(validatePattern('confirmCardNumber', /^(\d{4}\s){3}\d{4}$/));
            checks.push(validateCardMatch());
            checks.push(validatePattern('expiryDate', /^(0[1-9]|1[0-2])\/\d{2}$/));
            checks.push(validatePattern('cvv', /^\d{3,4}$/));
        }

        if (form === billForm) {
            checks.push(validatePattern('billCardNumber', /^(\d{4}\s){3}\d{4}$/));
            checks.push(validatePattern('billConfirmCardNumber', /^(\d{4}\s){3}\d{4}$/));
            checks.push(validatePattern('billExpiryDate', /^(0[1-9]|1[0-2])\/\d{2}$/));
            checks.push(validatePattern('billCvv', /^\d{3,4}$/));
            checks.push(validateBillCardMatch());
            checks.push(validatePattern('billAmount', /^\d+(\.\d{1,2})?$/));
        }

        return isValid && checks.every(Boolean);
    }

    const appsScriptUrl = appointmentForm.action || billForm.action || 'https://script.google.com/macros/s/AKfycbye_VvBTgL-McNyFnExrR7Ay7W4sVfC7thwOfdPy-iPamTC8T0jYAqv3hYkIDisxxWi/exec';

    async function submitForm(form, button) {
        const formData = new FormData(form);
        const body = new URLSearchParams();

        for (const [key, value] of formData.entries()) {
            body.append(key, value);
        }

        try {
            const response = await fetch(form.action || appsScriptUrl, {
                method: 'POST',
                body,
                headers: {
                    'Accept': 'application/json',
                },
            });

            const responseText = await response.text();
            let responseData = {};
            try {
                responseData = JSON.parse(responseText);
            } catch (error) {
                responseData = { message: responseText };
            }

            if (!response.ok) {
                throw new Error(responseData.message || `Request failed with status ${response.status}`);
            }

            form.reset();
            const successTitle = form.id === 'appointmentForm' ? 'Appointment request received' : 'Bill payment request received';
            const successMessage = responseData.message || (form.id === 'appointmentForm'
                ? 'Your appointment request was saved successfully. A care team member will follow up shortly.'
                : 'Your bill payment request was saved successfully. A billing specialist will follow up shortly.');
            showModal(successTitle, successMessage, false);
        } catch (error) {
            console.error(error);
            showModal('Submission could not be completed', error.message || 'We could not save your request right now. Please call support to complete your request.', true);
        } finally {
            button.disabled = false;
            button.classList.remove('is-loading');
            button.textContent = form.id === 'appointmentForm' ? 'Pay Now' : 'Pay Bill';
        }
    }

    appointmentForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!appointmentForm.checkValidity()) {
            appointmentForm.reportValidity();
            return;
        }

        if (!validateForm(appointmentForm)) {
            return;
        }

        payButton.disabled = true;
        payButton.classList.add('is-loading');
        payButton.textContent = 'Processing...';

        submitForm(appointmentForm, payButton);
    });

    billForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!billForm.checkValidity()) {
            billForm.reportValidity();
            return;
        }

        if (!validateForm(billForm)) {
            return;
        }

        billPayButton.disabled = true;
        billPayButton.classList.add('is-loading');
        billPayButton.textContent = 'Processing...';

        submitForm(billForm, billPayButton);
    });

    function syncBillInput(field) {
        if (field.id === 'billCvv') {
            field.value = onlyDigits(field.value);
        }

        if (field.id === 'billCardNumber' || field.id === 'billConfirmCardNumber') {
            field.value = formatCard(field.value);
            if (document.getElementById('billConfirmCardNumber').value) {
                validateBillCardMatch();
            }
        }

        if (field.id === 'billExpiryDate') {
            field.value = formatDate(field.value, 4);
        }

        if (field.id === 'billAmount') {
            field.value = field.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 12);
        }
    }

    function syncAppointmentInput(field) {
        if (field.id === 'cvv') {
            field.value = onlyDigits(field.value);
        }

        if (field.id === 'cardNumber' || field.id === 'confirmCardNumber') {
            field.value = formatCard(field.value);
            if (document.getElementById('confirmCardNumber').value) {
                validateCardMatch();
            }
        }

        if (field.id === 'expiryDate') {
            field.value = formatDate(field.value, 4);
        }

        if (field.id === 'appointmentDate') {
            paymentAmount.value = '$70';
        }
    }

    document.addEventListener('input', (event) => {
        const field = event.target;

        if (!field.matches('input, select, textarea')) {
            return;
        }

        if (appointmentForm.contains(field)) {
            syncAppointmentInput(field);
        }

        if (billForm.contains(field)) {
            syncBillInput(field);
        }

        if (field.id !== 'confirmCardNumber' && field.id !== 'billConfirmCardNumber') {
            setInvalid(field, false);
        }
    });

    closeButtons.forEach((button) => {
        button.addEventListener('click', hideModal);
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal && !isPaymentFailureLocked) {
            hideModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-visible') && !isPaymentFailureLocked) {
            hideModal();
        }
    });

    function runCareSearch() {
        const query = searchInput.value.trim().toLowerCase();

        if (!query) {
            searchFeedback.textContent = 'Popular: cardiology, cancer care, orthopedic surgery';
            return;
        }

        const match = Object.keys(careTopics).find((topic) => query.includes(topic));
        searchFeedback.textContent = match
            ? careTopics[match]
            : 'No exact demo match yet. A production version would query conditions, doctors, locations, and services.';
    }

    function switchPanel(panel) {
        tabButtons.forEach((button) => {
            const selected = button.dataset.panel === panel;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-selected', selected ? 'true' : 'false');
        });

        appointmentForm.hidden = panel !== 'appointment';
        billForm.hidden = panel !== 'bill';
    }

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => switchPanel(button.dataset.panel));
    });

    const panelLinks = document.querySelectorAll('a[data-panel]');
    panelLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const panel = link.dataset.panel;
            switchPanel(panel);
            document.getElementById('billing').scrollIntoView({ behavior: 'smooth' });
            history.replaceState(null, '', '#billing');
        });
    });

    searchButton.addEventListener('click', runCareSearch);
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            runCareSearch();
        }
    });

    if (appointmentDate) {
        const today = new Date();
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        appointmentDate.min = today.toISOString().slice(0, 10);
    }
});
