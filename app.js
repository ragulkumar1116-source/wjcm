/**
 * Aadhav Intech - Report Generator JavaScript
 * Handles dynamic preview updates, multi-sample preset loading, font selector, signature pads, and printing.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Inputs
  const selectFont = document.getElementById('select-font-family');
  const inputDate = document.getElementById('input-date');
  const inputCustName = document.getElementById('input-cust-name');
  const inputCustAddr1 = document.getElementById('input-cust-addr1');
  const inputCustAddr2 = document.getElementById('input-cust-addr2');
  const inputCustAddr3 = document.getElementById('input-cust-addr3');
  const inputContactPerson = document.getElementById('input-contact-person');
  const inputDept = document.getElementById('input-dept');
  const inputTel = document.getElementById('input-tel');
  const inputMobile = document.getElementById('input-mobile');
  const inputEmail = document.getElementById('input-email');

  const inputInstName = document.getElementById('input-inst-name');
  const inputInstModel = document.getElementById('input-inst-model');
  const inputSrNo = document.getElementById('input-sr-no');

  const chkInstallation = document.getElementById('chk-installation');
  const chkWarranty = document.getElementById('chk-warranty');
  const chkAmc = document.getElementById('chk-amc');
  const chkServices = document.getElementById('chk-services');
  const chkCalibration = document.getElementById('chk-calibration');
  const chkChargeable = document.getElementById('chk-chargeable');
  const inputChargeAmount = document.getElementById('input-charge-amount');

  const inputRegards = document.getElementById('input-regards');
  const inputActionTaken = document.getElementById('input-action-taken');
  const inputCustomerRemark = document.getElementById('input-customer-remark');

  // DOM Elements - Preview Targets
  const a4Doc = document.getElementById('a4-report-content');
  const viewDateCell = document.getElementById('view-date-cell');
  const viewCustName = document.getElementById('view-cust-name');
  const viewCustAddr1 = document.getElementById('view-cust-addr1');
  const viewCustAddr2 = document.getElementById('view-cust-addr2');
  const viewCustAddr3 = document.getElementById('view-cust-addr3');
  const viewContactPerson = document.getElementById('view-contact-person');
  const viewDept = document.getElementById('view-dept');
  const viewTel = document.getElementById('view-tel');
  const viewMobile = document.getElementById('view-mobile');
  const viewEmail = document.getElementById('view-email');

  const viewInstName = document.getElementById('view-inst-name');
  const viewInstModel = document.getElementById('view-inst-model');
  const viewSrNo = document.getElementById('view-sr-no');

  const viewChkInstallation = document.getElementById('view-chk-installation');
  const viewChkWarranty = document.getElementById('view-chk-warranty');
  const viewChkAmc = document.getElementById('view-chk-amc');
  const viewChkServices = document.getElementById('view-chk-services');
  const viewChkCalibration = document.getElementById('view-chk-calibration');
  const viewChkChargeable = document.getElementById('view-chk-chargeable');
  const viewChargeAmount = document.getElementById('view-charge-amount');

  const viewRegards = document.getElementById('view-regards');
  const viewActionTaken = document.getElementById('view-action-taken');
  const viewCustomerRemark = document.getElementById('view-customer-remark');

  const viewEngSigImg = document.getElementById('view-eng-sig-img');
  const viewCustSigImg = document.getElementById('view-cust-sig-img');

  // Buttons
  const btnLoadAdithya = document.getElementById('btn-load-adithya');
  const btnLoadGanga = document.getElementById('btn-load-ganga');
  const btnClearForm = document.getElementById('btn-clear-form');
  const btnPrintReport = document.getElementById('btn-print-report');

  // Preset 1: Adithya Techno Park (from New Installation repoat (1).doc)
  const adithyaData = {
    date: '20/08/2026',
    custName: 'ADITHYA TECHNO PARK',
    custAddr1: '368, Thudiyalur Rd, Vasantham Nagar',
    custAddr2: 'Saravanampatti',
    custAddr3: 'Coimbatore, Tamil Nadu 641035',
    contactPerson: 'A.ESAIMARAN',
    dept: 'STP',
    tel: '',
    mobile: '9944037958',
    email: 'Aesaimaran27@gmail.com',
    instName: 'OCEMS L- 600',
    instModel: 'AAD - OCEMS L - 600',
    srNo: 'WQA25024',
    installation: true,
    warranty: false,
    amc: false,
    services: false,
    calibration: false,
    chargeable: false,
    chargeAmount: '',
    regards: 'NEW Installation and Commissioning',
    actionTaken: `As per the scheduled site visit, the installation of the new AIT OCEMS L-600 system was successfully completed at Aditya Techno Park. The data configuration and network connectivity of the data logger were completed, and the system is now live and transmitting data properly. The main system parameters were checked and verified to ensure stable and reliable operation. The installation, configuration, commissioning, and system functionality checks were completed successfully. The end user was provided with the necessary guidance regarding system operation, basic functionality, monitoring procedures, and general usage. The system was successfully commissioned and handed over to the end user in a stable and operational condition.`,
    customerRemark: ''
  };

  // Preset 2: Ganga Hospital (from GANGA HOSPITAL.pdf)
  const gangaData = {
    date: '22/08/2026',
    custName: 'GANGA HOSPITAL',
    custAddr1: '313, Mettupalayam Road, near Saibaba',
    custAddr2: 'Koil (Saibaba Colony), Coimbatore,',
    custAddr3: 'Tamil Nadu, 641043',
    contactPerson: '',
    dept: '',
    tel: '',
    mobile: '',
    email: '',
    instName: 'OCEMS L - 600',
    instModel: 'AAD - OCEMS L - 600',
    srNo: '',
    installation: true,
    warranty: false,
    amc: false,
    services: false,
    calibration: false,
    chargeable: false,
    chargeAmount: '',
    regards: 'NEW Installation and Commissioning',
    actionTaken: `. As per the scheduled site visit, the installation and commissioning of the AIT OCEMS L-600 system, three flow meters, and data logger were successfully completed. All instrument values were checked and verified, and the input and output water lines were inspected and found to be properly connected without any leakages. The flow meters, OCEMS system, data logger communication, and all other required configuration works were completed successfully. The complete system was tested and found to be working properly.

Note: The required network connectivity is to be arranged from the customer side, either through a LAN cable connection or a pocket modem with a SIM-based network connection. Kindly provide the necessary PDC details and other required information to our office for completing the remaining configuration and PDC-related work.`,
    customerRemark: ''
  };

  /**
   * Sync Live Preview
   */
  function updatePreview() {
    viewDateCell.textContent = `Date: ${inputDate.value || 'DD/MM/YYYY'}`;
    viewCustName.textContent = inputCustName.value || '\u00A0';
    viewCustAddr1.textContent = inputCustAddr1.value || '\u00A0';
    viewCustAddr2.textContent = inputCustAddr2.value || '\u00A0';
    viewCustAddr3.textContent = inputCustAddr3.value || '\u00A0';
    viewContactPerson.textContent = inputContactPerson.value || '';
    viewDept.textContent = inputDept.value || '';
    viewTel.textContent = inputTel.value || '';
    viewMobile.textContent = inputMobile.value || '';
    viewEmail.textContent = inputEmail.value || '';

    viewInstName.textContent = inputInstName.value || '\u00A0';
    viewInstModel.textContent = inputInstModel.value || '\u00A0';
    viewSrNo.textContent = inputSrNo.value || '';

    viewChkInstallation.textContent = chkInstallation.checked ? '☑' : '☐';
    viewChkWarranty.textContent = chkWarranty.checked ? '☑' : '☐';
    viewChkAmc.textContent = chkAmc.checked ? '☑' : '☐';
    viewChkServices.textContent = chkServices.checked ? '☑' : '☐';
    viewChkCalibration.textContent = chkCalibration.checked ? '☑' : '☐';

    viewChkChargeable.textContent = chkChargeable.checked ? '☑' : '☐';
    viewChargeAmount.textContent = inputChargeAmount.value || '_______________';

    viewRegards.textContent = inputRegards.value || '';
    viewActionTaken.textContent = inputActionTaken.value || '';
    viewCustomerRemark.textContent = inputCustomerRemark.value || '';
  }

  /**
   * Font selector change
   */
  if (selectFont) {
    selectFont.addEventListener('change', (e) => {
      a4Doc.classList.remove('font-times', 'font-arial', 'font-calibri');
      a4Doc.classList.add(e.target.value);
    });
  }

  /**
   * Load Data
   */
  function loadFormData(data) {
    inputDate.value = data.date || '';
    inputCustName.value = data.custName || '';
    inputCustAddr1.value = data.custAddr1 || '';
    inputCustAddr2.value = data.custAddr2 || '';
    inputCustAddr3.value = data.custAddr3 || '';
    inputContactPerson.value = data.contactPerson || '';
    inputDept.value = data.dept || '';
    inputTel.value = data.tel || '';
    inputMobile.value = data.mobile || '';
    inputEmail.value = data.email || '';

    inputInstName.value = data.instName || '';
    inputInstModel.value = data.instModel || '';
    inputSrNo.value = data.srNo || '';

    chkInstallation.checked = !!data.installation;
    chkWarranty.checked = !!data.warranty;
    chkAmc.checked = !!data.amc;
    chkServices.checked = !!data.services;
    chkCalibration.checked = !!data.calibration;

    chkChargeable.checked = !!data.chargeable;
    inputChargeAmount.value = data.chargeAmount || '';

    inputRegards.value = data.regards || '';
    inputActionTaken.value = data.actionTaken || '';
    inputCustomerRemark.value = data.customerRemark || '';

    updatePreview();
  }

  // Event Listeners for real-time input sync
  const allInputs = document.querySelectorAll('#report-form input, #report-form textarea');
  allInputs.forEach(input => {
    input.addEventListener('input', updatePreview);
    input.addEventListener('change', updatePreview);
  });

  // Default load Adithya Techno Park doc preset
  loadFormData(adithyaData);

  // Preset Buttons
  btnLoadAdithya.addEventListener('click', () => {
    loadFormData(adithyaData);
  });

  btnLoadGanga.addEventListener('click', () => {
    loadFormData(gangaData);
  });

  // Clear Form Button
  btnClearForm.addEventListener('click', () => {
    loadFormData({
      date: new Date().toLocaleDateString('en-GB'),
      custName: '',
      custAddr1: '',
      custAddr2: '',
      custAddr3: '',
      contactPerson: '',
      dept: '',
      tel: '',
      mobile: '',
      email: '',
      instName: '',
      instModel: '',
      srNo: '',
      installation: false,
      warranty: false,
      amc: false,
      services: false,
      calibration: false,
      chargeable: false,
      chargeAmount: '',
      regards: '',
      actionTaken: '',
      customerRemark: ''
    });
  });

  // Print Button
  btnPrintReport.addEventListener('click', () => {
    window.print();
  });

  /* Signature Pads */
  function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const parentBox = btn.closest('.signature-input-box');
        parentBox.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        parentBox.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
      });
    });
  }
  setupTabs();

  function initSignatureCanvas(canvasId, clearBtnId, previewTargetEl) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000080';

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function startDrawing(e) {
      isDrawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      syncSignatureToPreview();
    }

    function stopDrawing() {
      if (isDrawing) {
        isDrawing = false;
        ctx.closePath();
        syncSignatureToPreview();
      }
    }

    function syncSignatureToPreview() {
      const dataUrl = canvas.toDataURL('image/png');
      previewTargetEl.innerHTML = `<img src="${dataUrl}" alt="Signature">`;
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    document.getElementById(clearBtnId).addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      previewTargetEl.innerHTML = '';
    });
  }

  initSignatureCanvas('canvas-engineer', 'btn-clear-eng-canvas', viewEngSigImg);
  initSignatureCanvas('canvas-customer', 'btn-clear-cust-canvas', viewCustSigImg);

  function setupFileUpload(inputId, previewTargetEl) {
    const fileInput = document.getElementById(inputId);
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          previewTargetEl.innerHTML = `<img src="${evt.target.result}" alt="Signature/Seal">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  setupFileUpload('file-engineer-sig', viewEngSigImg);
  setupFileUpload('file-customer-sig', viewCustSigImg);
});
