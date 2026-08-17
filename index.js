const { 
  Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, 
  ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, ModalBuilder, 
  TextInputBuilder, TextInputStyle, StringSelectMenuBuilder 
} = require('discord.js');
const http = require('http');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

const PREFIX = '!';
const STAFF_LOG_ID = process.env.STAFF_LOG_ID; // Log kanalı Render panelinden alınacak

client.once('ready', () => {
  console.log(`${client.user.tag} aktif! Project Swisty sistemleri tam sürüm hazır.`);
});

client.on('messageCreate', async message=> {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // 1. TICKET PANELİ
  if (command === 'ticket-panel') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    const embed = new EmbedBuilder().setTitle('Project Swisty -- Destek').setDescription('❄️ Bir kategori seçerek destek talebi oluştur.').setColor('#5865F2');
    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('select_ticket_category').setPlaceholder('Kategori Seç...').addOptions([
            { label: 'Destek', value: 'destek' }, { label: 'Satın Alım', value: 'satin_alim' },
            { label: 'Bug', value: 'bug' }, { label: 'Şikayet', value: 'sikayet' }, { label: 'Başvuru', value: 'yetkili' }
        ])
    );
    await message.channel.send({ embeds: [embed], components: [menu] });
    await message.delete();
  }

  // 2. BAŞVURU PANELİ
  if (command === 'basvuru-panel') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('apply_staff').setLabel('Başvur').setStyle(ButtonStyle.Success));
    await message.channel.send({ embeds: [new EmbedBuilder().setTitle('🛡️ Yetkili Başvuru').setColor('#2ECC71')], components: [row] });
    await message.delete();
  }

  // 3. ÇEKİLİŞ YÖNETİM PANELİ
  if (command === 'cekilis-yonet') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('open_giveaway_modal').setLabel('Yeni Çekiliş Başlat').setStyle(ButtonStyle.Danger));
    await message.channel.send({ content: '⚙️ **Çekiliş Yönetim Paneli**', components: [row] });
    await message.delete();
  }

  // 4. EMBED OLUŞTURUCU PANELİ
  if (command === 'embed-yap') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('open_embed_modal').setLabel('Yeni Embed Oluştur').setStyle(ButtonStyle.Secondary));
    await message.channel.send({ content: '🎨 **Embed Tasarım Paneli**', components: [row] });
    await message.delete();
  }
});

client.on('interactionCreate', async interaction => {
  // Select Menu (Ticket)
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_ticket_category') {
    const channel = await interaction.guild.channels.create({
        name: `${interaction.values[0]}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }]
    });
    await channel.send({ content: `${interaction.user} talebin alındı.` });
    await interaction.reply({ content: `Oluşturuldu: ${channel}`, ephemeral: true });
  }

  // Butonlar
  if (interaction.isButton()) {
    if (interaction.customId === 'apply_staff') {
      const modal = new ModalBuilder().setCustomId('staff_modal').setTitle('Başvuru Formu');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('name').setLabel('Ad').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('yas').setLabel('Yaş').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('why').setLabel('Neden?').setStyle(TextInputStyle.Paragraph).setRequired(true))
      );
      await interaction.showModal(modal);
    }
    if (interaction.customId === 'open_giveaway_modal') {
      const modal = new ModalBuilder().setCustomId('giveaway_setup_modal').setTitle('Yeni Çekiliş Oluştur');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('g_prize').setLabel('Ödül').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('g_winners').setLabel('Kazanan Sayısı').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('g_duration').setLabel('Süre (Dakika)').setStyle(TextInputStyle.Short).setRequired(true))
      );
      await interaction.showModal(modal);
    }
    if (interaction.customId === 'open_embed_modal') {
      const modal = new ModalBuilder().setCustomId('embed_modal').setTitle('Embed Oluşturucu');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('e_title').setLabel('Başlık').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('e_desc').setLabel('Açıklama').setStyle(TextInputStyle.Paragraph).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('e_color').setLabel('Renk Kodu (Örn: #5865F2)').setStyle(TextInputStyle.Short).setRequired(true))
      );
      await interaction.showModal(modal);
    }
    if (interaction.customId === 'join_giveaway') {
      await interaction.reply({ content: '🎉 Çekilişe katıldın!', ephemeral: true });
    }
  }

  // Modallar (Form Gönderimleri)
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'staff_modal') {
      const logChannel = client.channels.cache.get(STAFF_LOG_ID);
      if (logChannel) logChannel.send({ embeds: [new EmbedBuilder().setTitle('Yeni Başvuru').setDescription(`Ad: ${interaction.fields.getTextInputValue('name')}\nYaş: ${interaction.fields.getTextInputValue('yas')}\nNeden: ${interaction.fields.getTextInputValue('why')}`)] });
      await interaction.reply({ content: 'Başvurun iletildi!', ephemeral: true });
    }
    if (interaction.customId === 'giveaway_setup_modal') {
      const embed = new EmbedBuilder().setTitle('🎁 ' + interaction.fields.getTextInputValue('g_prize'))
        .setDescription(`👥 **Kazanan:** ${interaction.fields.getTextInputValue('g_winners')}\n⏳ **Süre:** ${interaction.fields.getTextInputValue('g_duration')} dk\n\nButona bas ve katıl!`)
        .setColor('#F1C40F');
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('join_giveaway').setLabel('Çekilişe Katıl').setStyle(ButtonStyle.Primary).setEmoji('🎉'));
      await interaction.channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: '✅ Çekiliş başlatıldı!', ephemeral: true });
    }
    if (interaction.customId === 'embed_modal') {
      const title = interaction.fields.getTextInputValue('e_title');
      const desc = interaction.fields.getTextInputValue('e_desc');
      const color = interaction.fields.getTextInputValue('e_color');

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor(color)
        .setFooter({ text: 'Project Swisty Tasarım' });

      await interaction.channel.send({ embeds: [embed] });
      await interaction.reply({ content: '✅ Embed başarıyla oluşturuldu ve gönderildi!', ephemeral: true });
    }
  }
});

// Render 7/24 Port Sunucusu
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Project Swisty Bot aktif!');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Web sunucusu ${PORT} portunda calisiyor.`);
});

client.login(process.env.TOKEN);
