// const isDevelopment = false // env.ENV === 'development'
// const isPreProd = false // env.ENV === 'pre_production'

const env = process.env.NODE_ENV

// dev and staging config
const devCfg = {
  siteUrl: 'https://staging.dashboard.meshplusplus.com',
  path: 'https://api.staging.dashboard.meshplusplus.com',
  ws_path: 'wss://api.staging.dashboard.meshplusplus.com/ws',
  client_id: '3_12t0ttvs1mu8k844gk4c84488cg480socscw4wkk48cog0oog0',
  client_secret: '1tsdprrwwfnog4sko8cw8ks8s400cokwo4kkosk0o8ccoo8gwg',
}

const preProdCfg = {
  siteUrl: 'https://dev.dashboard.meshplusplus.com',
  path: 'https://api.dev.dashboard.meshplusplus.com',
  ws_path: 'wss://api.dev.dashboard.meshplusplus.com/ws',
  client_id: '3_kqqsbd0xzbk8c400oggo8swc4ow4kkckso04scw48gwg8880g',
  client_secret: '8uf5utkxv10c088wkggogg0scgsw0c88oo8okc8k48c004g4s',
}

const prodCfg = {
  siteUrl: 'https://dashboard.meshplusplus.com',
  path: 'https://api.dashboard.meshplusplus.com',
  ws_path: 'wss://api.dashboard.meshplusplus.com/ws',
  client_id: '3_kqqsbd0xzbk8c400oggo8swc4ow4kkckso04scw48gwg8880g',
  client_secret: '8uf5utkxv10c088wkggogg0scgsw0c88oo8okc8k48c004g4s',
}

// Make sure the Android Phone is in the same wifi network as the backend server
// and replace the IP address below with your Laptop's IP address
const localCfg = {
  siteUrl: 'http://192.168.100.28:3000',
  path: 'http://192.168.100.28:8000',
  ws_path: 'wss://192.168.100.28:8000/ws',
  client_id: '3_kqqsbd0xzbk8c400oggo8swc4ow4kkckso04scw48gwg8880g',
  client_secret: '8uf5utkxv10c088wkggogg0scgsw0c88oo8okc8k48c004g4s',
}

//export default env === 'production' ? prodCfg : devCfg
//  export default localCfg
//  export default devCfg
export default prodCfg
