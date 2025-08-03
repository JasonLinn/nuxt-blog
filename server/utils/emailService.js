import nodemailer from 'nodemailer'

// 創建郵件傳送器
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  // 驗證環境變數
  if (!emailUser || !emailPassword) {
    throw new Error(
      '郵件設定不完整:\n' +
      `EMAIL_USER: ${emailUser ? '已設定' : '❌ 未設定'}\n` +
      `EMAIL_PASSWORD: ${emailPassword ? '已設定' : '❌ 未設定'}\n\n` +
      '請在 .env 檔案中設定正確的 Gmail 認證資訊。\n' +
      '詳細設定步驟請參考：docs/gmail-setup-guide.md'
    );
  }

  // 驗證 Gmail 地址格式
  if (!emailUser.includes('@gmail.com')) {
    console.warn('警告: EMAIL_USER 似乎不是 Gmail 地址，可能導致連接問題');
  }

  // 驗證應用程式密碼格式（應該是 16 位）
  if (emailPassword.length !== 16) {
    console.warn(
      `警告: EMAIL_PASSWORD 長度為 ${emailPassword.length} 位，` +
      '標準的 Gmail 應用程式密碼應該是 16 位。\n' +
      '請確認您使用的是應用程式密碼而不是一般密碼。'
    );
  }

  console.log(`初始化郵件服務: ${emailUser} (密碼長度: ${emailPassword.length})`);

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword
    },
    // 添加除錯選項
    debug: false, // 設為 true 可看到詳細日誌
    logger: false // 設為 true 可看到連接日誌
  });
}

// 審核通過郵件模板
const getApprovalEmailTemplate = (homestayName, homestayId) => {
  return {
    subject: '🎉 恭喜！您的民宿申請已通過審核',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 審核通過通知</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #2d3748; margin-bottom: 20px;">親愛的民宿業者，您好！</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 20px;">
            非常高興通知您，您的民宿申請已經通過我們的審核！
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #48bb78; margin: 20px 0;">
            <h3 style="color: #48bb78; margin: 0 0 10px 0;">民宿資訊</h3>
            <p style="margin: 5px 0; color: #4a5568;"><strong>民宿名稱：</strong>${homestayName}</p>
            <p style="margin: 5px 0; color: #4a5568;"><strong>申請編號：</strong>${homestayId}</p>
            <p style="margin: 5px 0; color: #4a5568;"><strong>狀態：</strong><span style="color: #48bb78; font-weight: bold;">已通過審核</span></p>
          </div>
          
          <h3 style="color: #2d3748; margin-top: 30px;">接下來您可以：</h3>
          <ul style="color: #4a5568; line-height: 1.8;">
            <li>您的民宿現在會在我們的平台上顯示</li>
            <li>客戶可以搜尋並查看您的民宿資訊</li>
            <li>您可以隨時更新民宿資訊</li>
            <li>如有任何問題，歡迎聯繫我們的客服團隊</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #718096; font-size: 14px;">
              感謝您選擇我們的平台，祝您營運順利！
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #a0aec0; font-size: 12px; text-align: center;">
            這是系統自動發送的郵件，請勿直接回覆。如有疑問請聯繫客服團隊。
          </p>
        </div>
      </div>
    `
  }
}

// 審核拒絕郵件模板
const getRejectionEmailTemplate = (homestayName, homestayId, rejectionReason) => {
  return {
    subject: '📋 您的民宿申請審核結果通知',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📋 審核結果通知</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #2d3748; margin-bottom: 20px;">親愛的民宿業者，您好！</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 20px;">
            感謝您提交民宿申請，經過我們的仔細審核，很遺憾您的申請暫時未能通過。
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #e53e3e; margin: 20px 0;">
            <h3 style="color: #e53e3e; margin: 0 0 10px 0;">申請資訊</h3>
            <p style="margin: 5px 0; color: #4a5568;"><strong>民宿名稱：</strong>${homestayName}</p>
            <p style="margin: 5px 0; color: #4a5568;"><strong>申請編號：</strong>${homestayId}</p>
            <p style="margin: 5px 0; color: #4a5568;"><strong>狀態：</strong><span style="color: #e53e3e; font-weight: bold;">審核未通過</span></p>
          </div>
          
          <div style="background: #fff5f5; padding: 20px; border-radius: 8px; border: 1px solid #fed7d7; margin: 20px 0;">
            <h3 style="color: #c53030; margin: 0 0 10px 0;">未通過原因</h3>
            <p style="color: #742a2a; line-height: 1.6; margin: 0;">${rejectionReason}</p>
          </div>
          
          <h3 style="color: #2d3748; margin-top: 30px;">如何改善：</h3>
          <ul style="color: #4a5568; line-height: 1.8;">
            <li>請根據上述原因調整您的民宿資訊</li>
            <li>確保所有必填欄位都已完整填寫</li>
            <li>提供清晰、準確的民宿照片和描述</li>
            <li>您可以重新提交申請</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; background: #edf2f7; border-radius: 8px;">
            <p style="color: #4a5568; margin: 0; font-weight: 500;">
              如有任何疑問或需要協助，歡迎聯繫我們的客服團隊
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #a0aec0; font-size: 12px; text-align: center;">
            這是系統自動發送的郵件，請勿直接回覆。如有疑問請聯繫客服團隊。
          </p>
        </div>
      </div>
    `
  }
}

// 發送審核通過郵件
export const sendApprovalEmail = async (toEmail, homestayName, homestayId) => {
  try {
    const transporter = createTransporter()
    const { subject, html } = getApprovalEmailTemplate(homestayName, homestayId)
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@yourdomain.com',
      to: toEmail,
      subject,
      html
    }
    
    const result = await transporter.sendMail(mailOptions)
    console.log('審核通過郵件發送成功:', {
      messageId: result.messageId,
      to: toEmail,
      homestayName,
      homestayId
    })
    
    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error) {
    console.error('發送審核通過郵件失敗:', error)
    throw new Error(`郵件發送失敗: ${error.message}`)
  }
}

// 發送審核拒絕郵件
export const sendRejectionEmail = async (toEmail, homestayName, homestayId, rejectionReason) => {
  try {
    const transporter = createTransporter()
    const { subject, html } = getRejectionEmailTemplate(homestayName, homestayId, rejectionReason)
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@yourdomain.com',
      to: toEmail,
      subject,
      html
    }
    
    const result = await transporter.sendMail(mailOptions)
    console.log('審核拒絕郵件發送成功:', {
      messageId: result.messageId,
      to: toEmail,
      homestayName,
      homestayId,
      rejectionReason
    })
    
    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error) {
    console.error('發送審核拒絕郵件失敗:', error)
    throw new Error(`郵件發送失敗: ${error.message}`)
  }
}

// 測試郵件設定
export const testEmailConnection = async () => {
  try {
    const transporter = createTransporter()
    
    console.log('開始測試郵件服務連接...')
    await transporter.verify()
    
    console.log('✅ 郵件服務連接測試成功')
    return { 
      success: true, 
      message: '郵件服務設定正確！Gmail SMTP 連接成功。' 
    }
  } catch (error) {
    console.error('❌ 郵件服務連接測試失敗:', error)
    
    // 分析具體錯誤類型並提供解決建議
    let errorMessage = '郵件服務設定錯誤';
    let suggestion = '';
    
    if (error.message.includes('Invalid login')) {
      errorMessage = 'Gmail 登入認證失敗';
      suggestion = '\n\n解決建議:\n' +
        '1. 確認已啟用兩步驟驗證\n' +
        '2. 使用應用程式密碼而非一般密碼\n' +
        '3. 檢查 EMAIL_USER 和 EMAIL_PASSWORD 設定\n' +
        '4. 參考 docs/gmail-setup-guide.md 詳細步驟';
    } else if (error.message.includes('connection')) {
      errorMessage = '網路連接錯誤';
      suggestion = '\n\n解決建議:\n' +
        '1. 檢查網路連接\n' +
        '2. 確認防火牆未封鎖 SMTP 連接\n' +
        '3. 嘗試稍後重試';
    } else if (error.message.includes('郵件設定不完整')) {
      errorMessage = '環境變數設定不完整';
      suggestion = '\n\n請按照 docs/gmail-setup-guide.md 設定 .env 檔案';
    }
    
    return { 
      success: false, 
      message: `${errorMessage}: ${error.message}${suggestion}`
    }
  }
} 