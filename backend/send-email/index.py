import json
import os
import smtplib
import urllib.request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def handler(event: dict, context) -> dict:
    """Отправка уведомления о записи на показ — в Telegram и на почту anyuta_nev@mail.ru"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    name = body.get('name', '')
    phone = body.get('phone', '')
    date = body.get('date', '')
    time_slot = body.get('time', '')
    comment = body.get('comment', '')

    # --- Telegram ---
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    if bot_token and chat_id:
        text = (
            f"🏠 *Новая запись на показ!*\n\n"
            f"👤 *Имя:* {name}\n"
            f"📞 *Телефон:* {phone}\n"
            f"📅 *Дата:* {date}\n"
            f"🕐 *Время:* {time_slot}\n"
        )
        if comment:
            text += f"💬 *Комментарий:* {comment}\n"
        text += "\n📍 ул. Алябьева, д. 2 · 3 этаж"

        tg_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        tg_payload = json.dumps({
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'Markdown'
        }).encode('utf-8')
        tg_req = urllib.request.Request(tg_url, data=tg_payload, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(tg_req)

    # --- Email ---
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    email_address = 'anyuta_nev@mail.ru'
    if smtp_password:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Новая запись на показ: {date} в {time_slot}'
        msg['From'] = email_address
        msg['To'] = email_address

        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: #ff4f2e; padding: 20px 24px;">
              <h2 style="color: white; margin: 0; font-size: 20px;">🏠 Новая запись на показ</h2>
              <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">ул. Алябьева, д. 2 · 3 этаж</p>
            </div>
            <div style="padding: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #888; font-size: 14px; width: 120px;">Имя</td><td style="padding: 8px 0; font-weight: bold; color: #222;">{name}</td></tr>
                <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Телефон</td><td style="padding: 8px 0; font-weight: bold; color: #222;">{phone}</td></tr>
                <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Дата</td><td style="padding: 8px 0; font-weight: bold; color: #222;">{date}</td></tr>
                <tr><td style="padding: 8px 0; color: #888; font-size: 14px;">Время</td><td style="padding: 8px 0; font-weight: bold; color: #222;">{time_slot}</td></tr>
                {"<tr><td style='padding: 8px 0; color: #888; font-size: 14px;'>Комментарий</td><td style='padding: 8px 0; color: #222;'>" + comment + "</td></tr>" if comment else ""}
              </table>
            </div>
          </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(html, 'html'))
        with smtplib.SMTP_SSL('smtp.mail.ru', 465) as server:
            server.login(email_address, smtp_password)
            server.sendmail(email_address, email_address, msg.as_string())

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'ok': True})
    }
