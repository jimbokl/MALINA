#!/usr/bin/env python3
"""Capture visible Wordcraft tables through ChromeUse Apple Events. No network endpoint replay."""
import argparse, datetime, json, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent
PID=68223
TAB_ID='1149565673'

def chrome(js):
    prefix=f'''var c=Application({PID}); var t=c.windows().flatMap(w=>w.tabs()).find(t=>String(t.id())==={json.dumps(TAB_ID)}); if(!t) throw Error("Research tab missing"); if(!t.url().startsWith("https://webmaster.yandex.ru/site/efficiency/wordcraft/")) throw Error("Unexpected target: "+t.url()); '''
    r=subprocess.run(['osascript','-l','JavaScript','-e',prefix+'t.execute({javascript:'+json.dumps(js)+'});'],text=True,capture_output=True,timeout=20)
    if r.returncode: raise RuntimeError(r.stderr)
    return r.stdout.strip()

CAPTURE='''JSON.stringify({url:location.href,title:document.title,query:document.querySelector('input[placeholder="Слово или фраза"]')?.value,tabs:[...document.querySelectorAll('.g-tab_active')].map(e=>e.innerText),tables:[...document.querySelectorAll('table')].map(t=>({class:t.className,rows:[...t.rows].map(r=>({cells:[...r.cells].map(c=>c.innerText.trim()),links:[...r.querySelectorAll('a[href]')].map(a=>({text:a.innerText,href:a.href}))}))})),alerts:[...document.querySelectorAll('[role="alert"]')].map(e=>e.innerText)})'''

def capture(name):
    data=json.loads(chrome(CAPTURE)); data['captured_utc']=datetime.datetime.now(datetime.timezone.utc).isoformat()
    (ROOT/'raw'/f'{name}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'file':name,'query':data['query'],'tabs':data['tabs'],'row_counts':[len(t['rows'])-1 for t in data['tables']]},ensure_ascii=False))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('action',choices=['capture','js']);p.add_argument('value');a=p.parse_args()
    if a.action=='capture': capture(a.value)
    else: print(chrome(a.value))
