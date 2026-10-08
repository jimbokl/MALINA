import json,subprocess,time,sys,shutil,datetime
from urllib.parse import urlencode
from pathlib import Path
from chrome_capture import chrome,capture,PID,TAB_ID,ROOT,CAPTURE

def wait_stable(query,tab=None,rivals=None):
    prior=None;stable=0
    for _ in range(60):
        d=json.loads(chrome(CAPTURE))
        valid=d.get('query')==query and len(d['tables'])>=2 and len(d['tables'][0]['rows'])>0 and (not tab or tab in d['tabs']) and (not rivals or rivals in d['tabs'])
        key=json.dumps(d['tables'],ensure_ascii=False)
        if valid and key==prior:stable+=1
        else:stable=0
        if stable>=2:return d
        prior=key;time.sleep(.65)
    raise RuntimeError('Tables did not stabilize: '+query)

def select(label):
    chrome('[...document.querySelectorAll("button")].find(e=>e.innerText.trim()==='+json.dumps(label)+').click();"selected"')

def export(query,slug):
    downloads=Path('/Users/dmitrij/Downloads')
    before={p for p in downloads.glob('wordcraft-tables-info-*.xlsx')}
    chrome('document.querySelector(".DownloaderButton").click();"export requested"')
    for _ in range(240):
        paths=[p for p in downloads.glob('wordcraft-tables-info-*.xlsx') if p not in before and query in p.name]
        if paths:
            dest=ROOT/'exports'/f'{slug}.xlsx';dest.parent.mkdir(exist_ok=True)
            shutil.copy2(max(paths,key=lambda p:p.stat().st_mtime),dest)
            meta={'query':query,'ui_url':json.loads(chrome('JSON.stringify(location.href)')),'captured_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_filename':paths[-1].name}
            dest.with_suffix('.metadata.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
            print('Export saved: '+str(dest),flush=True);return
        time.sleep(.5)
    raise RuntimeError('No completed XLS download: '+query)

def collect(query,slug):
    url='https://webmaster.yandex.ru/site/efficiency/wordcraft/?'+urlencode({'device':'ALL_DEVICES','tab':'GENERAL','query':query,'mode':'QUERY','userQueries':'PAGES','rivals':'GENERAL','regions':'225'})
    script=f'var c=Application({PID});var t=c.windows().flatMap(w=>w.tabs()).find(t=>String(t.id())==={json.dumps(TAB_ID)});t.url={json.dumps(url)};'
    r=subprocess.run(['osascript','-l','JavaScript','-e',script],capture_output=True,text=True,timeout=15)
    if r.returncode:raise RuntimeError(r.stderr)
    time.sleep(1)
    wait_stable(query)
    select('Основные');wait_stable(query,'Основные');select('Страницы');wait_stable(query,'Основные','Страницы');capture(slug+'-main-pages')
    select('Дополнительные');wait_stable(query,'Дополнительные','Страницы');capture(slug+'-additional-pages')
    select('Сайты');wait_stable(query,'Дополнительные','Сайты');capture(slug+'-additional-sites');export(query,slug)

if __name__=='__main__':
    for q,slug in json.loads(sys.argv[1]):collect(q,slug)
