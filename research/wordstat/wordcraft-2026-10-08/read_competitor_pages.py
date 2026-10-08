#!/usr/bin/env python3
"""Read public competitor headings in the dedicated external Chrome tab."""
import datetime
import json
import subprocess
import time
from pathlib import Path
from chrome_capture import PID, TAB_ID, ROOT


def jxa(source):
    result = subprocess.run(['osascript', '-l', 'JavaScript', '-e', source],
                            text=True, capture_output=True, timeout=20)
    if result.returncode:
        raise RuntimeError(result.stderr)
    return result.stdout.strip()


prefix = f'var c=Application({PID});var t=c.windows().flatMap(w=>w.tabs()).find(t=>String(t.id())==={json.dumps(TAB_ID)});if(!t)throw Error("Research tab missing");'
original = jxa(prefix + 't.url();')
directory = ROOT / 'competitor-page-reads'
directory.mkdir(exist_ok=True)
try:
    for path in sorted((ROOT / 'competitor-maps').glob('*.json')):
        source = json.loads(path.read_text())
        url = source['competitor_url']
        jxa(prefix + 't.url=' + json.dumps(url) + ';')
        prior = None
        data = None
        for attempt in range(30):
            time.sleep(.7)
            js = '''JSON.stringify({url:location.href,title:document.title,ready:document.readyState,
                headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>e.innerText.trim()).filter(Boolean),
                intro:(document.querySelector('article')||document.querySelector('main')||document.body).innerText.slice(0,1200),
                image_count:document.querySelectorAll('article img,main img').length})'''
            try:
                data = json.loads(jxa(prefix + 't.execute({javascript:' + json.dumps(js) + '});'))
            except (ValueError, RuntimeError):
                continue
            if not isinstance(data, dict):
                continue
            if data['url'] == url and data['headings'] and data['ready'] == 'complete' and data == prior:
                break
            prior = data
        data = data or {'url': url, 'error': 'No DOM readback'}
        data['expected_url'] = url
        data['captured_utc'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        data['verified_url'] = data.get('url') == url
        (directory / path.name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps({'file': path.name, 'title': data.get('title'),
                          'verified_url': data['verified_url'], 'headings': data.get('headings', [])[:18]}, ensure_ascii=False), flush=True)
finally:
    jxa(prefix + 't.url=' + json.dumps(original) + ';')
    for _ in range(20):
        time.sleep(.3)
        if jxa(prefix + 't.url();') == original:
            print('Restored dedicated research tab', flush=True)
            break
