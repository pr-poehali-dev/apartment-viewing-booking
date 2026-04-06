import json
import os
import urllib.request


def handler(event: dict, context) -> dict:
    """Отправка уведомления о записи на показ квартиры в Telegram"""

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

    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')

    text = (
        f"🏠 *Новая запись на показ!*\n\n"
        f"👤 *Имя:* {name}\n"
        f"📞 *Телефон:* {phone}\n"
        f"📅 *Дата:* {date}\n"
        f"🕐 *Время:* {time}\n"
    )
    if comment:
        text += f"💬 *Комментарий:* {comment}\n"
    text += f"\n📍 ул. Алябьева, д. 2 · 3 этаж"

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = json.dumps({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'Markdown'
    }).encode('utf-8')

    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(req)

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'ok': True})
    }
