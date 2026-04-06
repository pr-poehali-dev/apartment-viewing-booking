import json
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def handler(event: dict, context) -> dict:
    """Отправка заявки на показ квартиры на почту romeo.nefedov@bk.ru"""

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
    time = body.get('time', '')
    comment = body.get('comment', '')

    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    from_email = 'romeo.nefedov@bk.ru'
    to_email = 'romeo.nefedov@bk.ru'

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Новая запись на показ: {date} в {time}'
    msg['From'] = from_email
    msg['To'] = to_email

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: #ff4f2e; padding: 20px 24px;">
          <h2 style="color: white; margin: 0; font-size: 20px;">Новая запись на показ квартиры</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">ул. Алябьева, д. 2 · 3 этаж</p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #888; font-size: 14px; width: 120px;">Имя</td>
              <td style="padding: 8px 0; font-weight: bold; color: #222;">{name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888; font-size: 14px;">Телефон</td>
              <td style="padding: 8px 0; font-weight: bold; color: #222;">{phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888; font-size: 14px;">Дата</td>
              <td style="padding: 8px 0; font-weight: bold; color: #222;">{date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888; font-size: 14px;">Время</td>
              <td style="padding: 8px 0; font-weight: bold; color: #222;">{time}</td>
            </tr>
            {"<tr><td style='padding: 8px 0; color: #888; font-size: 14px;'>Комментарий</td><td style='padding: 8px 0; color: #222;'>" + comment + "</td></tr>" if comment else ""}
          </table>
        </div>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html, 'html'))

    with smtplib.SMTP_SSL('smtp.mail.ru', 465) as server:
        server.login(from_email, smtp_password)
        server.sendmail(from_email, to_email, msg.as_string())

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'ok': True})
    }