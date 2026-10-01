# HTTPS для malinaklubnika.ru: диагностика и обращение

Проверено 29 сентября 2026 года в 17:22 UTC. Задача: `W-05`. Публикация GitHub Pages для [`jimbokl/MALINA`](https://github.com/jimbokl/MALINA), источник — GitHub Actions. Последний проверенный успешный запуск публикации: [36598691190](https://github.com/jimbokl/MALINA/actions/runs/36598691190), коммит `03d0df5`.

## Наблюдения

- В Pages настроен `malinaklubnika.ru`; сайт по HTTP отвечает, но обычный HTTPS корня и `www` не проходит проверку имени сертификата. `https_enforced: false`.
- Ранее интерфейс Pages показывал `DNS check unsuccessful` и `InvalidDNSError` с текстом `Domain's DNS record could not be retrieved`. После ручного `Check again` 28 сентября примерно в 17:10 UTC UI показывает `DNS Check in Progress`, `Certificate Requested`; Pages API возвращает `https_certificate.state: new`, описание `This domain was recently added. The certificate request process will begin shortly.` В 16:54 UTC 29 сентября состояние всё ещё `new`, `https_enforced: false`; это почти 24 часа после повторной проверки. `/pages/health` отвечает HTTP 202 с пустым `{}` и не указывает причину. [Статус GitHub](https://www.githubstatus.com/) показывает Pages Operational и не сообщает о массовом сбое.
- Google Public DNS и Cloudflare DNS возвращают для корня четыре A-записи `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. `www` возвращает CNAME `jimbokl.github.io`. NS: `ns1.reg.ru`, `ns2.reg.ru`. У корня нет AAAA, CAA и DS; по открытой документации GitHub конфигурация с этими A-записями допустима. У `www` CAA наследуется через CNAME от `github.io` и разрешает `letsencrypt.org`.
- С 25 сентября DNS проверялся неоднократно. 27 сентября около 05:54 UTC домен один раз сняли и назначили повторно в Pages; сертификат не появился. 28 сентября DNS не меняли и домен повторно не снимали.

## Уведомление REG.RU от 29 сентября: отдельный сертификат

REG.RU сообщил об ошибке выпуска своего SSL-сертификата для `www.malinaklubnika.ru`: его удостоверяющий центр GlobalSign не разрешён CAA. В зоне `malinaklubnika.ru` CAA действительно нет, но `www` — CNAME на `jimbokl.github.io`. При проверке CAA резолвер следует за CNAME и получает записи GitHub с `issue "digicert.com"`, `issue "letsencrypt.org"`, `issue "sectigo.com"` (и соответствующие `issuewild`); `globalsign.com` там нет. Этим объясняется одновременно упоминание DigiCert и фраза REG.RU «CAA записи не обнаружены» применительно к нашей зоне.

Этот отказ относится к сертификату REG.RU, а не к автоматическому сертификату GitHub Pages. GitHub Pages использует Let's Encrypt, который разрешён CAA у цели CNAME; у корня CAA нет. По состоянию на утро 29 сентября Pages API всё ещё показывает `https_certificate.state: new`, `https_enforced: false`. Точную причину задержки выдачи со стороны Pages публичный API пока не сообщает. Добавление только `globalsign.com` на корне может заблокировать Let's Encrypt для корня и не устранит ограничение у цели CNAME для `www`; такую правку без подтверждения не делать.

## Дальнейшие действия 29 сентября

В 17:22 UTC, после суточной отметки, Pages API по-прежнему возвращает `https_certificate.state: new`, `https_enforced: false`. В интерфейсе Pages показаны `DNS Check in Progress` и `1 of 3 Certificate Requested`; кнопки `Check again` нет, поэтому повторная проверка не запускалась. Оба авторитативных сервера REG.RU возвращают четыре ожидаемых A-записи корня и CNAME `www` на `jimbokl.github.io`; у корня нет AAAA и CAA. Обычный HTTPS обоих имён отклоняется из-за несоответствия имени сертификата. Повторить `Check again` однократно, только если кнопка снова появится и повторная проверка после 17:10 UTC ещё не была выполнена. DNS и привязку домена во время текущего запроса не менять. Если повторная проверка снова зависнет без конкретной ошибки, подготовить запасное размещение статического `dist/` с управляемым HTTPS; сначала проверить его на временном адресе и только затем планировать перенос DNS с учётом остальных записей зоны.

### Повторная проверка и обращение

Владелец 29 сентября разрешил обратиться в GitHub. Портал GitHub Support для личного аккаунта `jimbokl` с планом Free показал `Technical support not included` и не предложил категорию Pages для тикета. [Документация GitHub](https://docs.github.com/en/support/contacting-github-support/creating-a-support-ticket) подтверждает, что технические обращения для Free подаются через GitHub Community. Опубликован [вопрос #209098](https://github.com/orgs/community/discussions/209098) с данными API, DNS и просьбой проверить выпуск сертификата. Дубликат не создавать; отслеживать ответы в обсуждении.

При повторной проверке Pages API состояние осталось `new`, `/pages/health` вернул HTTP 202 и `{}`. Оба авторитативных NS вновь подтвердили ровно четыре A-записи, CNAME для `www` и пустой ответ CAA со статусом NOERROR. У родительской зоны `.ru` нет DS для домена, так что активная цепочка DNSSEC не мешает выпуску. Последний GitHub Actions [run 36598691190](https://github.com/jimbokl/MALINA/actions/runs/36598691190) завершился успешно. HTTP корня возвращает 200, HTTP `www` — 301 на корень. `curl` с обычной проверкой TLS отклоняет сертификат и для корня, и для `www` из-за несовпадения имени. `npm run check:public` падает по той же причине: представленный сертификат содержит `*.github.io`, но не `malinaklubnika.ru`. Файл CNAME в репозитории не нужен при публикации через GitHub Actions. В workflow `SITE_URL` пока использует HTTP; это влияет на ссылки в опубликованном HTML, но не объясняет состояние `new` и должно быть переключено на HTTPS после выдачи сертификата.

## Если запрос снова завершится ошибкой

Не менять DNS вслепую и не перезапускать запрос многократным снятием домена. Сохранить точное время и новый текст ошибки, приложить вывод:

```sh
gh api repos/jimbokl/MALINA/pages --jq '{cname,https_enforced,https_certificate}'
gh api repos/jimbokl/MALINA/pages/health -i
dig @8.8.8.8 malinaklubnika.ru A +short
dig @1.1.1.1 www.malinaklubnika.ru CNAME +short
curl -Iv https://malinaklubnika.ru/
curl -Iv https://www.malinaklubnika.ru/
```

## Черновик обращения в GitHub Support

**Subject:** GitHub Pages custom domain DNS check / certificate stuck for malinaklubnika.ru

Hello GitHub Support,

Our GitHub Pages site for `jimbokl/MALINA` is published successfully through GitHub Actions. The custom domain `malinaklubnika.ru` serves the site over HTTP, but HTTPS cannot be enabled. Pages previously reported `InvalidDNSError: Domain's DNS record could not be retrieved` for the apex and alternate domain. After using “Check again” on 28 September 2026 around 17:10 UTC, the UI changed to “DNS Check in Progress / Certificate Requested”. As of 29 September 16:54 UTC, nearly 24 hours later, the Pages API still reports `https_certificate.state: new` with the description “This domain was recently added. The certificate request process will begin shortly.” `/pages/health` returns HTTP 202 with an empty object.

Public Google and Cloudflare DNS both return the four GitHub Pages A addresses for `malinaklubnika.ru` (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and `www.malinaklubnika.ru` CNAME to `jimbokl.github.io`. The authoritative REG.RU nameserver confirms the same records. There are no apex AAAA, CAA or DS records. The CAA record at the CNAME target permits Let's Encrypt. The site has a successful deployment at https://github.com/jimbokl/MALINA/actions/runs/36598691190. The domain was removed and re-added once on 27 September; the issue persisted. We have not made any further DNS or custom-domain changes while this certificate request is in progress. A separate REG.RU/GlobalSign certificate attempt for `www` failed because GlobalSign is not permitted by the CAA at the GitHub CNAME target; this is unrelated to GitHub Pages' Let's Encrypt certificate request.

If validation remains stuck or fails again, could you please inspect what DNS lookup or certificate provisioning step is failing from GitHub's side, and advise what exact change is required? We can provide fresh Pages API output and DNS traces.

Thank you.

Исторический черновик сохранён для справки. Фактически отправленное обращение находится в GitHub Community по ссылке выше.

## Ответ сообщества и повторная диагностика 30 сентября

Около 07:35 UTC в [обсуждении #209098](https://github.com/orgs/community/discussions/209098) ответил участник сообщества `bosmdavid-gif` (это не официальный ответ сотрудника GitHub). Он указал на [похожее обсуждение #208881](https://github.com/orgs/community/discussions/208881) с DNS-серверами REG.RU и предложил повторить `/pages/health` и CAA-запрос по TCP, прежде чем рассматривать перенос DNS-зоны.

Повторный вызов `/pages/health` 30 сентября около 07:43 UTC вернул HTTP 200 и уже не пустой объект. Для `malinaklubnika.ru`: `dns_resolves:false`, `caa_error:"Dnsruby::ResolvTimeout"`, `is_valid:false`, причина `InvalidDNSError: Domain's DNS record could not be retrieved`. Для `www.malinaklubnika.ru`: `dns_resolves:false`, `caa_error:"Dnsruby::ServFail"`, та же причина. При этом Pages API по-прежнему сообщает `https_certificate.state:"new"` и `https_enforced:false`. Эндпоинт health иногда временно возвращает `{}` при асинхронной проверке, поэтому сохранять именно полный ответ с ошибками.

Локальный `dig +tcp @ns1.reg.ru ... CAA` завершился таймаутом, но в этой же среде таймаутом завершаются и контрольные TCP/53-запросы к Google и Cloudflare; это ограничение локального сетевого пути, а не доказательство сбоя REG.RU. Независимая проверка через `isitdns.net` с Cloudflare edge 30 сентября около 07:44 UTC успешно опросила **все 16 IPv4-адресов** `ns1.reg.ru` и `ns2.reg.ru` по TCP/53: ответ CAA для корня — авторитативный `NOERROR`, без CAA, примерно 39–46 мс. Пример: [запрос к 194.58.117.17](https://isitdns.net/#dig?name=malinaklubnika.ru&qtype=CAA&resolver=custom&customIps=194.58.117.17). По TCP/53 запрос `www` CNAME к 194.58.117.17 тоже получил авторитативный `NOERROR` и `jimbokl.github.io`; Google по TCP/53 вернул CNAME и CAA цели, включая `issue "letsencrypt.org"`.

Вывод на момент проверки: причина задержки подтверждённо находится в DNS-проверке GitHub Pages, но **общий отказ TCP/53 на REG.RU не подтвердился**. Возможны различия сетевого пути или поведения резолвера GitHub; перенос DNS-зоны — проверяемый обходной путь.

## Перенос DNS на Cloudflare 30 сентября

Владелец прямо поручил сменить DNS по совету из обсуждения GitHub. Около 08:00–08:06 UTC в аккаунте Cloudflare создана зона `malinaklubnika.ru` на бесплатном плане. Автоматический импорт сравнен с зоной REG.RU: четыре A корня на `185.199.108.153`–`185.199.111.153`, `www` CNAME на `jimbokl.github.io`, TXT `_globalsign-domain-verification=RQp11f2o0_IzufO6FA72Ir2tw_QIZ3Z6sOuRWFuZgg`. Все шесть записей установлены в режим **DNS only**. У назначенных Cloudflare `dexter.ns.cloudflare.com` и `stella.ns.cloudflare.com` до делегирования напрямую получены нужные A, CNAME и TXT. CAA корня у Cloudflare отсутствует; DS в зоне `.ru` отсутствует.

REG.RU принял замену NS `ns1.reg.ru`/`ns2.reg.ru` на `dexter.ns.cloudflare.com`/`stella.ns.cloudflare.com`; интерфейс подтвердил «DNS-серверы изменены». Cloudflare находится в состоянии ожидания делегирования. На 08:07 UTC сервер зоны `.ru` и публичные резолверы ещё показывают старые NS, что ожидаемо сразу после изменения. HTTP-корень возвращает 200, `www` перенаправляет на корень; сертификат Pages пока `state:new`, `https_enforced:false`. Следующий шаг — дождаться появления новых NS у `.ru` и в публичных резолверах, перепроверить `/pages/health` и выпуск сертификата.

## Сертификат выпущен после вмешательства GitHub Support — 1 октября 2026

- В [тикете 4811705](https://help.github.com/ticket/personal/0/4811705) сотрудник GitHub Support Saidi сообщил, что повторно запустил обработку запроса TLS, сертификат одобрен и установлен. Тикет закрыт. Исходная причина сбоя не названа; нельзя считать доказанной ошибку REG.RU, Cloudflare, DNSSEC или конкретной очереди GitHub.
- В 12:09 UTC Pages API подтвердил `https_certificate.state: approved`, имена `malinaklubnika.ru` и `www.malinaklubnika.ru`, срок до 30.12.2026. Обычные HTTPS-запросы прошли проверку TLS: корень — 200, `www` — 301 на HTTPS-корень.
- Через Pages API включён `https_enforced: true`, настройка прочитана обратно. DNS и привязка домена не изменялись.
- `.github/workflows/pages.yml` переведён с HTTP на `SITE_URL=https://malinaklubnika.ru`; это переводит canonical, sitemap и robots на HTTPS при публикации.
- Локальная сборка с HTTPS создала 719 HTML-страниц; `npm test` — 244 успешно, без ошибок и пропусков. Логи и сохранённый ответ поддержки: `/Users/dmitrij/Documents/ChatGPT/Personal/artifacts/malina-https/`.
- HTTPS закрыл причину предполагаемого переезда. Остальные критерии W-05 (индексация, дубли и CWV) остаются отдельной работой.

## Приёмка опубликованного HTTPS — 1 октября 2026

- Релиз `c1f4cc2ee56dafcf6bef977a5614b11967b45985` опубликован: [Pages](https://github.com/jimbokl/MALINA/actions/runs/36860772937) и [Site checks](https://github.com/jimbokl/MALINA/actions/runs/36860772784) успешны на этом SHA.
- `npm run check:public` завершился с кодом 0: robots, sitemap и все 469 HTML-страниц из sitemap прошли проверку TLS, canonical и базового HTML. Локальная сборка содержит 719 HTML-файлов; в sitemap входят индексируемые страницы.
- Главная, `/malina/`, `/klubnika/`, `/sorta/`, `/podbor/`, `/in-vitro/`, `/otzyvy/`, `/guide/` доступны по обычному HTTPS с кодом 200. CSS, JS, JSON каталога и WASM отвечают 200 с подходящими типами содержимого. Первые отдельные curl-запросы встретили сетевые таймауты; повторные запросы и полная проверка прошли.
- HTTP-корень перенаправляется на HTTPS-корень; HTTP `www` через HTTP-корень заканчивается на HTTPS-корне. HTTPS `www` перенаправляется непосредственно на HTTPS-корень. Валидация TLS включена во всех проверках.
- Внешний Chrome проверен через Apple Events и DOM: подбор малины для Калининграда показывает 48 сортов, 18 с официальным региональным допуском; клубника для Амурской области — общее сравнение 38 сортов, `no_verified_rule`, без региональных результатов и отметок допуска. После перезагрузки canonical страницы — HTTPS. Снимок: `artifacts/malina-https/picker-https-no-regional-data.png` в рабочей папке чата.
- Повторное чтение Pages API подтвердило `approved` и `https_enforced: true`; health вернул `{}`. Автоматизация `https-2` удалена через инструмент приложения после полной успешной проверки. Переезд из-за TLS не требуется.
