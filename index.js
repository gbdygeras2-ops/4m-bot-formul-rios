const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  SlashCommandBuilder, 
  REST, 
  Routes,
  PermissionsBitField
} = require('discord.js');

// Pega o token seguro do ambiente
const TOKEN = process.env.DISCORD_TOKEN;

const CLIENT_ID = "1468785989299474534";  // ID do bot
const GUILD_ID = "1483618517210108086";   // ID do servidor

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Controle de ponto
let pontos = {};
let ranking = {};
let relatorio = {};

// Formata tempo
function formatTempo(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

// Bot online
client.once('ready', async () => {
  console.log(`✅ Logado como ${client.user.tag}`);
  const canal = await client.channels.fetch(CANAL_INFO);
  canal.send({
    embeds: [new EmbedBuilder()
      .setTitle("📊 Bate Ponto 4m")
      .setDescription("🚀 Sistema Automático de Bate Ponto Ativado! Agora não é necessário usar comandos.")
      .setColor("Blue")
      .setImage("https://i.ibb.co/x8SmhSg5/4m.webp")]
  });
});

// Detecta entrada e saída de call
client.on('voiceStateUpdate', async (oldState, newState) => {
  const user = newState.member;
  if (!oldState.channel && newState.channel) {
    if (CANAIS_BLOQUEADOS.includes(newState.channel.id)) return;
    if (pontos[user.id]) return;
    pontos[user.id] = Date.now();
    if (!relatorio[user.id]) relatorio[user.id] = { tempo: 0, sessoes: 0 };
    relatorio[user.id].sessoes++;
  }
  if (oldState.channel && !newState.channel && pontos[user.id]) {
    const tempo = Math.floor((Date.now() - pontos[user.id]) / 60000);
    ranking[user.id] = (ranking[user.id] || 0) + tempo;
    relatorio[user.id].tempo += tempo;
    delete pontos[user.id];
  }
});

// Comandos slash (mantidos simplificados)
const commands = [
  new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Ver ranking semanal"),
].map(c => c.toJSON());

// Registrar comandos
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
})();

// Logar o bot
client.login(TOKEN);
