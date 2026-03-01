'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check, BookMarked } from 'lucide-react'

function buildBookmarklet(appUrl: string): string {
  // Les caractères Unicode (², €, è) sont construits via String.fromCharCode()
  // pour éviter tout problème d'encodage dans l'URL javascript:.
  //
  // seLoger : données dans les balises <meta og:> et <meta name="description">
  //   og:title = "Appartement T3/F3 62.74 m² 767.07 € Toulouse (31200)"
  //
  // Leboncoin : window.__NEXT_DATA__ -> props.pageProps.ad
  //   ad.subject, ad.price[0], ad.location.lat/lng, ad.attributes[]
  const code = `(function(){
var d={};
var sq=String.fromCharCode(178);
var eu=String.fromCharCode(8364);
var nb=String.fromCharCode(160);
var sp='[\\\\s'+nb+']*';
var h=window.location.hostname;

if(h.indexOf('seloger.com')>-1){
  var ot=document.querySelector('meta[property="og:title"]');
  var desc=document.querySelector('meta[name="description"]');
  var img=document.querySelector('meta[property="og:image"]');
  var ogUrl=document.querySelector('meta[property="og:url"]');
  var str=ot?ot.getAttribute('content'):'';
  if(str){
    d.title=str;
    var sm=str.match(new RegExp('([\\\\d,.]+)'+sp+'m'+sq));
    if(sm)d.surface=parseFloat(sm[1].replace(',','.'));
    var pm=str.match(new RegExp('([\\\\d,.]+)'+sp+eu));
    if(pm)d.price=parseFloat(pm[1].replace(',','.'));
    var am=str.match(new RegExp(eu+'[\\\\s'+nb+']+(.+)$'));
    if(am)d.address=am[1].replace(/\\((\\d+)\\)/,'$1').trim();
  }
  if(desc){
    var rm=desc.getAttribute('content').match(/([0-9]+)\\s*pi.ces?/i);
    if(rm)d.rooms=parseInt(rm[1]);
  }
  if(img)d.photo_url=img.getAttribute('content');
  d.url=ogUrl?ogUrl.getAttribute('content'):window.location.href;
}

else if(h.indexOf('leboncoin.fr')>-1){
  try{
    var nd=document.getElementById('__NEXT_DATA__');
    if(nd){
      var n=JSON.parse(nd.textContent);
      var a=n.props&&n.props.pageProps&&n.props.pageProps.ad;
      if(a){
        var at={};
        (a.attributes||[]).forEach(function(x){at[x.key]=x.value;});
        d.title=a.subject;
        d.price=a.price&&a.price[0];
        var sq2=parseFloat(at.square);
        if(!isNaN(sq2))d.surface=sq2;
        var rm2=parseInt(at.rooms);
        if(!isNaN(rm2))d.rooms=rm2;
        var ch=parseInt(at.monthly_charges);
        if(!isNaN(ch))d.charges=ch;
        if(at.furnished==='1')d.is_furnished=true;
        d.photo_url=a.images&&a.images.urls&&a.images.urls[0];
        d.url=a.url||window.location.href;
        if(a.location&&a.location.lat&&a.location.lng){
          d.latitude=a.location.lat;
          d.longitude=a.location.lng;
        }else if(a.location){
          d.address=a.location.city_label||a.location.city;
        }
      }
    }
  }catch(e){}
}

Object.keys(d).forEach(function(k){if(d[k]===undefined||d[k]===null||d[k]==='')delete d[k];});
if(!d.url)d.url=window.location.href;
var u='${appUrl}/import?data='+btoa(unescape(encodeURIComponent(JSON.stringify(d))));
var w=window.open(u,'_blank');
if(!w){window.location.href=u;}
})();`

  return 'javascript:' + encodeURIComponent(code)
}

export function BookmarkletSection() {
  const [appUrl, setAppUrl] = useState('')
  const [copied, setCopied] = useState(false)
  // React bloque les href javascript: pour raisons de sécurité.
  // On bypasse via setAttribute direct sur le nœud DOM après le mount.
  const linkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const origin = window.location.origin
    setAppUrl(origin)
    if (linkRef.current) {
      linkRef.current.setAttribute('href', buildBookmarklet(origin))
    }
  }, [])

  const bookmarkletHref = appUrl ? buildBookmarklet(appUrl) : '#'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bookmarkletHref)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookMarked className="h-5 w-5" />
          Bookmarklet d&apos;import
        </CardTitle>
        <CardDescription>
          Importez une annonce depuis seLoger ou Leboncoin en un clic.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>
            Affichez la barre de favoris Chrome avec{' '}
            <kbd className="rounded border px-1 py-0.5 text-xs font-mono">⌘ Shift B</kbd>.
          </li>
          <li>Glissez le bouton ci-dessous dans cette barre.</li>
          <li>Sur une page d&apos;annonce seLoger ou Leboncoin, cliquez dessus.</li>
          <li>Le formulaire s&apos;ouvre avec les données pré-remplies.</li>
        </ol>

        <div className="flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            ref={linkRef}
            href="#"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 select-none cursor-grab active:cursor-grabbing"
            onClick={(e) => e.preventDefault()}
            draggable
          >
            <BookMarked className="h-4 w-4" />
            Importer dans Immo Tracker
          </a>

          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!appUrl}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copié !' : 'Copier le lien'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Si le glisser-déposer ne fonctionne pas : copiez le lien, puis dans Chrome faites{' '}
          <strong>clic droit sur la barre de favoris → Ajouter une page</strong> et collez-le dans
          le champ URL.
        </p>
      </CardContent>
    </Card>
  )
}
