#!/usr/bin/env python3
"""Read the rendered Wordcraft competitor-query dialogs through ChromeUse."""
import datetime
import json
import subprocess
import time
from urllib.parse import urlencode

from chrome_capture import ROOT, PID, TAB_ID, chrome
from collect import select, wait_stable


def save_dialog(seed, url, expected, name):
    prior = None
    repeats = 0
    for _ in range(70):
        raw = chrome('''(()=>{const m=document.querySelector('.Rivals-Popup.g-modal_open');
            if(!m)return JSON.stringify(null);
            return JSON.stringify({ui_url:location.href,heading:m.innerText.split('\\n').slice(0,3),
            queries:[...m.querySelectorAll('.Rivals-PopupTable tr')].slice(1).map(r=>r.innerText.trim())});})()''')
        data = json.loads(raw)
        if data and url in data['heading'] and len(data['queries']) == expected and raw == prior:
            repeats += 1
        else:
            repeats = 0
        if repeats >= 2:
            data.update(seed=seed, competitor_url=url, expected_ui_queries=expected,
                        captured_utc=datetime.datetime.now(datetime.timezone.utc).isoformat())
            (ROOT / 'competitor-maps').mkdir(exist_ok=True)
            (ROOT / 'competitor-maps' / f'{name}.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
            print(name, expected, 'stable queries saved', flush=True)
            chrome('document.querySelector(".Rivals-Popup .Modal2-CloseButton").click();"closed"')
            for _ in range(20):
                if chrome('Boolean(document.querySelector(".Rivals-Popup.g-modal_open"))') == 'false':
                    return
                time.sleep(.3)
            raise RuntimeError('Dialog did not close')
        prior = raw
        time.sleep(.65)
    raise RuntimeError('Dialog did not stabilize: ' + url)


def open_dialog(seed, url, name):
    nav = 'https://webmaster.yandex.ru/site/efficiency/wordcraft/?' + urlencode({
        'device': 'ALL_DEVICES', 'tab': 'GENERAL', 'query': seed, 'mode': 'QUERY',
        'userQueries': 'PAGES', 'rivals': 'GENERAL', 'regions': '225'})
    script = f'var c=Application({PID});var t=c.windows().flatMap(w=>w.tabs()).find(t=>String(t.id())==={json.dumps(TAB_ID)});t.url={json.dumps(nav)};'
    result = subprocess.run(['osascript', '-l', 'JavaScript', '-e', script], capture_output=True, text=True, timeout=15)
    if result.returncode:
        raise RuntimeError(result.stderr)
    wait_stable(seed)
    select('Основные'); wait_stable(seed, 'Основные')
    select('Страницы'); wait_stable(seed, 'Основные', 'Страницы')
    raw = chrome('''(()=>{const row=[...document.querySelectorAll('.Rivals-Table tr')]
        .find(r=>r.querySelector('a[href]')?.href===''' + json.dumps(url) + ''');
        if(!row)throw Error('Competitor row absent');
        const a=row.querySelector('a:not([href])');const count=Number(a.innerText);a.click();
        return JSON.stringify({expected:count});})()''')
    save_dialog(seed, url, json.loads(raw)['expected'], name)


if __name__ == '__main__':
    save_dialog('болезни клубники', 'https://pogoda.mail.ru/news/66104528/', 40, 'strawberry-diseases-mail')
    for args in [
        ('болезни клубники', 'https://www.botanichka.ru/article/bolezni-klubniki-chem-obrabotat-yagodnyj-kustarnik-posle-plodonosheniya/', 'strawberry-diseases-botanichka'),
        ('болезни малины', 'https://www.botanichka.ru/article/10-samyih-rasprostranyonnyih-bolezney-malinyi-i-metodyi-borbyi-s-nimi/', 'raspberry-diseases-botanichka'),
        ('сорта клубники', 'https://stroy-podskazka.ru/klubnika/sorta/aziya/', 'strawberry-asia-stroy'),
    ]:
        open_dialog(*args)
