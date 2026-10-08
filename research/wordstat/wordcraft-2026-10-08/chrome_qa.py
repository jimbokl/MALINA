#!/usr/bin/env python3
"""Local MALINA QA in a dedicated real Chrome window using Apple Events/DOM."""
import argparse,json,subprocess,time
from pathlib import Path
ROOT=Path(__file__).resolve().parent
STATE=json.loads((ROOT/'qa-chrome-state.json').read_text())

def run(js):
    prefix='var c=Application(68223); var w=c.windows().find(w=>String(w.id())==='+json.dumps(STATE['windowId'])+'); if(!w) throw Error("Owned QA window missing"); var t=w.tabs().find(t=>String(t.id())==='+json.dumps(STATE['tabId'])+'); if(!t) throw Error("Owned QA tab missing"); '
    r=subprocess.run(['osascript','-l','JavaScript','-e',prefix+js],text=True,capture_output=True,timeout=20)
    if r.returncode: raise RuntimeError(r.stderr)
    return r.stdout.strip()

def dom(js):
    return run('if(!t.url().startsWith("http://127.0.0.1:5181/")) throw Error("Unexpected QA URL: "+t.url()); t.execute({javascript:'+json.dumps(js)+'});')

def navigate(path):
    target='http://127.0.0.1:5181'+path
    run('t.url='+json.dumps(target)+';')
    for _ in range(60):
        if run('t.url();')==target:
            result=json.loads(dom('JSON.stringify({url:location.href,ready:document.readyState,h1:document.querySelector("h1")?.innerText})'))
            if result['url']==target and result['ready']=='complete' and result.get('h1'): return
        time.sleep(.2)
    raise RuntimeError('QA navigation did not settle: '+target)

SNAPSHOT='''JSON.stringify({url:location.href,title:document.title,h1:document.querySelector('h1')?.innerText,canonical:document.querySelector('link[rel=canonical]')?.href,viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,sections:[...document.querySelectorAll('main section[id]')].map(s=>({id:s.id,heading:s.querySelector('h2')?.innerText})),brokenVisibleImages:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.getBoundingClientRect().top<innerHeight).map(i=>i.src),duplicateIds:[...document.querySelectorAll('[id]')].map(e=>e.id).filter((id,i,all)=>all.indexOf(id)!==i),links:[...document.querySelectorAll('main a[href]')].map(a=>({text:a.innerText,href:a.getAttribute('href')}))})'''

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('action',choices=['navigate','capture','size','restore']);p.add_argument('value',nargs='?');a=p.parse_args()
    if a.action=='navigate': navigate(a.value);print(json.dumps({'url':run('t.url();')}))
    elif a.action=='size':
        width,height=map(int,a.value.split('x'));run('w.bounds='+json.dumps({'x':0,'y':33,'width':width,'height':height})+'; w.index=1; c.activate();');print(run('JSON.stringify(w.bounds());'))
    elif a.action=='capture':
        run('w.index=1; c.activate();');result=json.loads(dom(SNAPSHOT));(ROOT/'raw'/('qa-'+a.value+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
        b=json.loads(run('if(String(c.windows()[0].id())!==String(w.id())) throw Error("QA window is not foreground"); JSON.stringify(w.bounds());'))
        box=','.join(str(b[k]) for k in ['x','y','width','height']);dest=ROOT/'screenshots'/('qa-'+a.value+'.png');subprocess.run(['screencapture','-x','-R'+box,str(dest)],check=True)
        print(json.dumps({k:result[k] for k in ['url','h1','viewport','horizontalOverflow','brokenVisibleImages','duplicateIds']},ensure_ascii=False))
    elif a.action=='restore':
        before=STATE['before'];run('var original=c.windows().find(v=>String(v.id())==='+json.dumps(before['frontWindow'])+'); if(original){original.activeTabIndex='+str(before['activeIndex'])+';original.index=1;}');print('Restored previous Chrome window/tab')
