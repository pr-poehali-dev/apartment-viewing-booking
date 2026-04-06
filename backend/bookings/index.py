import json
import os
import smtplib
import urllib.request
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p53901747_apartment_viewing_bo')
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
}


def handler(event: dict, context) -> dict:
    """Управление записями на показ квартиры: получение занятых слотов и создание записи"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    # GET /  — вернуть занятые слоты для конкретной даты
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        date = params.get('date', '')
        if not date:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'date required'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT booking_time FROM {SCHEMA}.bookings WHERE booking_date = %s",
            (date,)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        booked = [r[0] for r in rows]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'booked': booked})}

    # POST / — создать запись
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        name = body.get('name', '').strip()
        phone = body.get('phone', '').strip()
        date = body.get('date', '').strip()
        time_slot = body.get('time', '').strip()
        comment = body.get('comment', '').strip()
        display_date = body.get('display_date', date)

        if not all([name, phone, date, time_slot]):
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все обязательные поля'})}

        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.bookings (booking_date, booking_time, name, phone, comment) VALUES (%s, %s, %s, %s, %s)",
                (date, time_slot, name, phone, comment)
            )
            conn.commit()
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            cur.close()
            conn.close()
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Это время уже занято, выберите другое'})}
        finally:
            cur.close()
            conn.close()

        # Telegram
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
        if bot_token and chat_id:
            text = (
                f"🏠 *Новая запись на показ!*\n\n"
                f"👤 *Имя:* {name}\n"
                f"📞 *Телефон:* {phone}\n"
                f"📅 *Дата:* {display_date}\n"
                f"🕐 *Время:* {time_slot}\n"
            )
            if comment:
                text += f"💬 *Комментарий:* {comment}\n"
            text += "\n📍 ул. Алябьева, д. 2 · 3 этаж"
            tg_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            tg_payload = json.dumps({'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'}).encode('utf-8')
            tg_req = urllib.request.Request(tg_url, data=tg_payload, headers={'Content-Type': 'application/json'})
            try:
                urllib.request.urlopen(tg_req)
            except Exception:
                pass

        # Email
        smtp_password = os.environ.get('SMTP_PASSWORD', '')
        email_address = 'anyuta_nev@mail.ru'
        if smtp_password:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f'Новая запись на показ: {display_date} в {time_slot}'
            msg['From'] = email_address
            msg['To'] = email_address
            html = f"""<html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
              <div style="max-width:500px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;">
                <div style="background:#ff4f2e;padding:20px 24px;">
                  <h2 style="color:white;margin:0;">🏠 Новая запись на показ</h2>
                  <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px;">ул. Алябьева, д. 2 · 3 этаж</p>
                </div>
                <div style="padding:24px;">
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px 0;color:#888;font-size:14px;width:120px;">Имя</td><td style="font-weight:bold;color:#222;">{name}</td></tr>
                    <tr><td style="padding:8px 0;color:#888;font-size:14px;">Телефон</td><td style="font-weight:bold;color:#222;">{phone}</td></tr>
                    <tr><td style="padding:8px 0;color:#888;font-size:14px;">Дата</td><td style="font-weight:bold;color:#222;">{display_date}</td></tr>
                    <tr><td style="padding:8px 0;color:#888;font-size:14px;">Время</td><td style="font-weight:bold;color:#222;">{time_slot}</td></tr>
                    {"<tr><td style='padding:8px 0;color:#888;font-size:14px;'>Комментарий</td><td style='color:#222;'>" + comment + "</td></tr>" if comment else ""}
                  </table>
                </div>
              </div>
            </body></html>"""
            msg.attach(MIMEText(html, 'html'))
            try:
                with smtplib.SMTP_SSL('smtp.mail.ru', 465) as server:
                    server.login(email_address, smtp_password)
                    server.sendmail(email_address, email_address, msg.as_string())
            except Exception:
                pass

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}
