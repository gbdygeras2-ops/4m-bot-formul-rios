const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  SlashCommandBuilder, 
  REST, 
  Routes,
  PermissionsBitField
} = require('discord.js');

const TOKEN = "MTQ4NTc0NTQ4OTcyMTk1MDI5OQ.GV2rDI.n6cJhewLX5gBP7cya_dcnJQH_b2-Nktf5vKgaE";
const CLIENT_ID = "1485745489721950299";
const GUILD_ID = "1484334313976762450";

const CANAL_LOG = "1484334315096768715";
const CANAL_INFO = "1484334315646222549";

// ❌ Canais que não contam
const CANAIS_BLOQUEADOS = [
  "1484334315494965273",
  "1484334315494965274",
  "1484334315494965275",
  "1484334316174704716",
  "1484334316174704717",
  "1484334316174704718",
  "1484334316174704719",
  "1484334316174704720",
  "1484334316174704721",
  "1484334316380098620",
  "1484334315096768722",
  "1484334314907762760",
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Controle de ponto atual
let pontos = {};
let ranking = {};
let relatorio = {};

// Função para formatar tempo em Xh Ymin
function formatTempo(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

// Bot online
client.once('ready', async () => {
  console.log(`✅ Logado como ${client.user.tag}`);

  // Mensagem fixa explicando o sistema automático
  const canal = await client.channels.fetch(CANAL_INFO);
  const embed = new EmbedBuilder()
    .setTitle("📊 Bate Ponto 4m")
    .setDescription(
      `🚀 **Sistema Automático de Bate Ponto Ativado!**\n\n` +
      `Agora NÃO é mais necessário usar comandos.\n\n` +
      `📌 Sempre que um membro entrar em uma call válida:\n` +
      `→ O ponto será iniciado automaticamente\n\n` +
      `📌 Ao sair da call:\n` +
      `→ O tempo será registrado automaticamente\n\n` +
      `⚠️ Canais como espera e recrutamento NÃO contam.\n\n` +
      `🔥 Sistema totalmente automático e otimizado.`
    )
    .setColor("Blue")
    .setImage("https://i.ibb.co/x8SmhSg5/4m.webp");

  canal.send({ embeds: [embed] });
});

// Detecta entrada e saída de call
client.on('voiceStateUpdate', async (oldState, newState) => {
  const user = newState.member;

  // Entrou
  if (!oldState.channel && newState.channel) {
    if (CANAIS_BLOQUEADOS.includes(newState.channel.id)) return;
    if (pontos[user.id]) return;

    pontos[user.id] = Date.now();
    if (!relatorio[user.id]) relatorio[user.id] = { tempo: 0, sessoes: 0 };
    relatorio[user.id].sessoes++;

    const canalLog = await client.channels.fetch(CANAL_LOG);
    canalLog.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("📊 Bate Ponto 4m")
          .setDescription(`👤 ${user}\n🎧 Entrou em **${newState.channel.name}**`)
          .setColor("Blue")
          .setImage("https://i.ibb.co/x8SmhSg5/4m.webp")
      ]
    });
  }

  // Saiu
  if (oldState.channel && !newState.channel) {
    if (!pontos[user.id]) return;

    const tempo = Date.now() - pontos[user.id];
    const minutos = Math.floor(tempo / 60000);

    if (!ranking[user.id]) ranking[user.id] = 0;
    ranking[user.id] += minutos;
    relatorio[user.id].tempo += minutos;

    delete pontos[user.id];

    const canalLog = await client.channels.fetch(CANAL_LOG);
    canalLog.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("📊 Bate Ponto 4m")
          .setDescription(
            `👤 ${user}\n📤 Saiu da call\n\n` +
            `⏱ Tempo: **${formatTempo(minutos)}**\n\n` +
            `📊 Tempo acumulado na semana atualizado.`
          )
          .setColor("Green")
          .setImage("https://i.ibb.co/x8SmhSg5/4m.webp")
      ]
    });
  }
});

// Comandos slash
const commands = [
  new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Ver ranking semanal")
    .addUserOption(o => o.setName("usuario").setDescription("Ver outro usuário")),

  new SlashCommandBuilder()
    .setName("relatorio")
    .setDescription("Ver relatório detalhado")
    .addUserOption(o => o.setName("usuario").setDescription("Ver outro usuário")),

  new SlashCommandBuilder()
    .setName("limpar")
    .setDescription("Resetar ranking"),

  new SlashCommandBuilder()
    .setName("sethoras")
    .setDescription("Ajustar manualmente o tempo de um usuário")
    .addUserOption(o => o.setName("usuario").setDescription("Usuário").setRequired(true))
    .addIntegerOption(o => o.setName("minutos").setDescription("Quantidade de minutos").setRequired(true))
].map(c => c.toJSON());

// Registrar comandos
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
})();

// Interações
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // 🔒 Verifica se é staff/admin
  const isStaff = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
  if (!isStaff) return interaction.reply({ content: "❌ Comando apenas para staff.", ephemeral: true });

  // LIMPAR
  if (interaction.commandName === "limpar") {
    ranking = {};
    relatorio = {};
    return interaction.reply({ content: "🧹 Ranking resetado com sucesso." });
  }

  // RANKING
  if (interaction.commandName === "ranking") {
    const user = interaction.options.getUser("usuario");
    if (user) {
      return interaction.reply(`👤 ${user}\n⏱ ${formatTempo(ranking[user.id] || 0)}`);
    }
    const sorted = Object.entries(ranking).sort((a,b)=>b[1]-a[1]);
    let desc = sorted.map((u,i)=>`**${i+1}º** <@${u[0]}> - ${formatTempo(u[1])}`).join("\n");
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle("🏆 Ranking").setDescription(desc||"Sem dados").setColor("Gold")] });
  }

  // RELATORIO
  if (interaction.commandName === "relatorio") {
    const user = interaction.options.getUser("usuario") || interaction.user;
    const data = relatorio[user.id];
    if (!data) return interaction.reply("❌ Sem dados desse usuário.");
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle("📊 Relatório de Bate Ponto")
        .setDescription(
          `👤 ${user}\n\n` +
          `⏱ Tempo total: **${formatTempo(data.tempo)}**\n` +
          `📞 Sessões em call: **${data.sessoes}**\n` +
          `📊 Média por sessão: **${formatTempo(Math.floor(data.tempo/data.sessoes))}**`
        )
        .setColor("Blue")
        .setImage("https://i.ibb.co/x8SmhSg5/4m.webp")]
    });
  }

  // SETHORAS
  if (interaction.commandName === "sethoras") {
    const user = interaction.options.getUser("usuario");
    const minutos = interaction.options.getInteger("minutos");

    if (!ranking[user.id]) ranking[user.id] = 0;
    if (!relatorio[user.id]) relatorio[user.id] = { tempo: 0, sessoes: 0 };

    ranking[user.id] = minutos;
    relatorio[user.id].tempo = minutos;

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle("🛠 Ajuste de Tempo")
        .setDescription(`👤 ${user}\n⏱ Tempo ajustado para **${formatTempo(minutos)}**`)
        .setColor("Orange")
        .setImage("https://i.ibb.co/x8SmhSg5/4m.webp")]
    });
  }
});

client.login(TOKEN);