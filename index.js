const {
    token,
    prefixo
} = require('./config.json')

const request = require("request");
const colors = require('colors_express')
const {
    Client
} = require('discord.js-selfbot-v11')
const rpc = require('discord-rpc')

const client = new Client(),
    rpcClient = new rpc.Client({
        transport: 'ipc'
    })

process.on('unhandledRejection', e => {})
process.on('uncaughtException', e => {})
process.on('uncaughtRejection', e => {})
process.warn = () => {};

client.on("error", () => {})

client.on("warn", () => {})

function printClear() {
    console.log(`



			
     .d8888b.  888                           
    d88P  Y88b 888                           
    888    888 888                           
    888        888  .d88b.   8888b.  888d888 
    888        888 d8P  Y8b     "88b 888P"   
    888    888 888 88888888 .d888888 888     
    Y88b  d88P 888 Y8b.     888  888 888     
     "Y8888P"  888  "Y8888  "Y888888 888     
                                                                            
    • ${client.user.tag} | Gatilho: '${prefixo}' em qualquer bate-papo. •
    `.brightMagenta)
}

console.clear()
process.title = `Clear - Carregando...`
console.log(`




    ██╗      ██████╗  █████╗ ██████╗ ██╗███╗   ██╗ ██████╗          
    ██║     ██╔═══██╗██╔══██╗██╔══██╗██║████╗  ██║██╔════╝          
    ██║     ██║   ██║███████║██║  ██║██║██╔██╗ ██║██║  ███╗         
    ██║     ██║   ██║██╔══██║██║  ██║██║██║╚██╗██║██║   ██║         
    ███████╗╚██████╔╝██║  ██║██████╔╝██║██║ ╚████║╚██████╔╝██╗██╗██╗
    ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝╚═╝
                                                                `.cyan)

function clear(authToken, authorId, channelId) {
    const wait = async (ms) => new Promise(done => setTimeout(done, ms))

    const headers = {
        "Authorization": authToken
    };

    const recurse = (before) => {
        let params = before ? `?before=${before}` : ``;

        request({
            url: `https://discord.com/api/v9/channels/${channelId}/messages${params}`,
            headers: headers,
            json: true
        }, async (error, response, result) => {
            if (response === undefined) {
                return recurse(before);
            }

            if (response.statusCode === 202) {
                const w = response.retry_after;

                console.log(`Ops, canal não indexado, espere ${w}ms para indexar as mensagens.`);

                await wait(w);

                return recurse(before);
            }

            if (response.statusCode !== 200) {
                return console.log('Aguardando API!', result);
            }

            for (let i in result) {
                let message = result[i];

                if (message.author.id === authorId && message.type !== 3) {
                    await new Promise((resolve) => {

                        const deleteRecurse = () => {
                            request.delete({
                                url: `https://discord.com/api/v9/channels/${channelId}/messages/${message.id}`,
                                headers: headers,
                                json: true
                            }, async (error, response, result) => {
                                if (error) {
                                    return deleteRecurse();
                                }
                                if (result) {
                                    if (result.retry_after !== undefined) {
                                        console.log(`Rate-limited! Esperando ${result.retry_after}ms para continuar a limpeza.`)
                                        await wait(result.retry_after * 1000);
                                        return deleteRecurse();
                                    }
                                }

                                resolve()
                            });
                        }

                        deleteRecurse();
                    });
                }
            }

            if (result.length === 0) {
                console.clear()
                printClear()
                console.log("Peguei vocês! Mensagens limpas!");
            } else {
                recurse(result[result.length - 1].id);
            }
        });
    }

    recurse();
}

client.on('ready', async () => {
    console.clear()
    process.title = `Clear | Conectado em: ${client.user.username}`
    printClear()
})

client.on('message', async (message) => {
    if (message.author.id != client.user.id) return
    if (message.content.toLowerCase() === prefixo) {
        message.delete()
        clear(token, client.user.id, message.channel.id);
        console.log(`Gatilho detectado - Iniciando o processo de limpeza....`)
    }
})

client.on('warn', () => {})
client.on('error', () => {})

client.login(token)
