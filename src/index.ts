import mime from 'mime';
import parser from 'accept-language-parser'

interface Env {
  assets: KVNamespace;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    //return error if not a get request
    if(request.method !== 'GET'){
      return new Response('Method Not Allowed', {
        status: 405,
      })
    }

    //get the key from the url & return error if key missing
    const parsedUrl = new URL(request.url)
    const key = parsedUrl.pathname.replace(/^\/+/, '') // strip any preceding /'s
    if(!key){
      return new Response('Missing path in URL', {
        status: 400
      })
    }

    //add handler for translation path
    if(key === 'hello-world'){
      //retrieve the language header from the request and the translations from KV
      const languageHeader = request.headers.get('Accept-Language') || 'en'//default to english
      const translations : {
        "language_code": string,
        "message": string
      }[] = await env.assets.get('hello-world.json', 'json') || [];

      //extract the requested language
      const supportedLanguageCodes = translations.map(item => item.language_code)
      const languageCode = parser.pick(supportedLanguageCodes, languageHeader, {
        loose: true
      })

      //get the message for the selected language
      let selectedTranslation = translations.find(item => item.language_code === languageCode)
      if(!selectedTranslation) selectedTranslation = translations.find(item => item.language_code === "en")
      const helloWorldTranslated = selectedTranslation!['message'];

      //generate and return the translated html
      const html = `<!DOCTYPE html>
      <html>
        <head>
          <title>Hello World translation</title>
        </head>
        <body>
          <h1>${helloWorldTranslated}</h1>
        </body>
      </html>
      `
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      })
    }

    //get the mimetype from the key path
    const extension = key.split('.').pop();
    let mimeType = mime.getType(key) || "text/plain";
    if (mimeType.startsWith("text") || mimeType === "application/javascript") {
      mimeType += "; charset=utf-8";
    }

    //get the value from the KV store and return it if found
    const value = await env.assets.get(key, 'arrayBuffer')
    if(!value){
      return new Response("Not found", {
        status: 404
      })
    }
    return new Response(value, {
      status: 200,
      headers: new Headers({
        "Content-Type": mimeType
      })
    });
  },
} satisfies ExportedHandler<Env>;
