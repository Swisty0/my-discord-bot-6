const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot aktif!'));
app.listen(port, () => console.log(`Web sunucusu ${port} portunda çalışıyor.`));

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, REST, Routes, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

// Render Environment (Environment Variables) veya .env dosyasından tokeni okur[cite: 1]
const TOKEN = process.env.DISCORD_TOKEN || process.env.TOKEN; 
const CLIENT_ID = '1538502658065834105';
const WELCOME_CHANNEL_ID = '1538172396941479966'; // Hoşgeldin Kanalı ID'si[cite: 1]

// Ana Komutlar (Admin Panellerini Tetikler)
const commands = [
    new SlashCommandBuilder()
        .setName('ticketkur')
        .setDescription('P L A T İN destek paneli yönetim menüsünü açar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('çekiliş')
        .setDescription('Adminler için gelişmiş çekiliş yönetim panelini açar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('rolkur')
        .setDescription('Butonlu rol alma paneli yönetim menüsünü açar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Özel duyuru ve özellikler embed paneli yönetim menüsünü açar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
    console.log(`[ANA BOT] ${client.user.tag} aktif ve modüller başarıyla yüklendi!`);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Tüm panel komutları başarıyla yüklendi!');
    } catch (error) {
        console.error('Komut yükleme hatası:', error);
    }
});

// Hoşgeldin Sistemi (Sunucuya Yeni Üye Katıldığında Çalışır)
client.on('guildMemberAdd', async member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setColor('#2f3136')
        .setAuthor({ name: 'P L A T İN • Ailemize Hoş Geldin!', iconURL: member.user.displayAvatarURL() })
        .setDescription(`Selam ${member}! Sunucumuza hoş geldin 🎉\n\nSeninle beraber **${member.guild.memberCount}** kişiye ulaştık! Keyifli vakit geçirmen dileğiyle.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

    await channel.send({ content: `${member}`, embeds: [welcomeEmbed] });
});

client.on('interactionCreate', async interaction => {
    // 1. Komutlar Çalıştırıldığında İlgili Paneli Açma
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === 'çekiliş') {
            const embed = new EmbedBuilder()
                .setColor('#2f3136')
                .setTitle('🎁 P L A T İN • Çekiliş Yönetim Paneli')
                .setDescription('Aşağıdaki butona tıklayarak ödül ve süre bilgilerini girip çekilişi başlatabilirsin.');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('open_giveaway_modal').setLabel('Çekiliş Oluştur').setStyle(ButtonStyle.Primary).setEmoji('🎉')
            );

            return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        if (commandName === 'ticketkur') {
            const embed = new EmbedBuilder()
                .setColor('#2f3136')
                .setTitle('🎫 P L A T İN • Ticket Panel Yönetimi')
                .setDescription('Aşağıdaki butona tıklayarak sunucuya **P L A T İN** destek panelini kurabilirsin.');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('open_ticket_modal').setLabel('Destek Paneli Kur').setStyle(ButtonStyle.Danger).setEmoji('🛠️')
            );

            return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        if (commandName === 'rolkur') {
            const embed = new EmbedBuilder()
                .setColor('#2f3136')
                .setTitle('🎭 P L A T İN • Rol Panel Yönetimi')
                .setDescription('Aşağıdaki butona tıklayarak üyelerin butonla rol alabileceği paneli oluşturabilirsin.');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('open_role_modal').setLabel('Rol Paneli Oluştur').setStyle(ButtonStyle.Success).setEmoji('📌')
            );

            return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        if (commandName === 'embed') {
            const embed = new EmbedBuilder()
                .setColor('#2f3136')
                .setTitle('📢 P L A T İN • Duyuru/Embed Yönetim Paneli')
                .setDescription('Aşağıdaki butona tıklayarak özel başlık ve içerikle duyuru embedi oluşturabilirsin.');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('open_embed_modal').setLabel('Embed Oluşturucu').setStyle(ButtonStyle.Secondary).setEmoji('📝')
            );

            return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }
    }

    // 2. Panellerdeki Butonlara Basıldığında Formları (Modals) Açma
    if (interaction.isButton()) {
        if (interaction.customId === 'open_giveaway_modal') {
            const modal = new ModalBuilder().setCustomId('giveaway_modal').setTitle('Çekiliş Ayarları');
            const odulInput = new TextInputBuilder().setCustomId('giveaway_prize').setLabel('Çekiliş Ödülü').setStyle(TextInputStyle.Short).setPlaceholder('Örn: VIP Üyelik').setRequired(true);
            const sureInput = new TextInputBuilder().setCustomId('giveaway_time').setLabel('Süre (Dakika)').setStyle(TextInputStyle.Short).setPlaceholder('Örn: 10').setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(odulInput), new ActionRowBuilder().addComponents(sureInput));
            return interaction.showModal(modal);
        }

        if (interaction.customId === 'open_ticket_modal') {
            const modal = new ModalBuilder().setCustomId('ticket_modal').setTitle('Ticket Paneli');
            const kanalInput = new TextInputBuilder().setCustomId('ticket_channel_id').setLabel('Gönderilecek Kanal ID (Boş bırakırsan burası)').setStyle(TextInputStyle.Short).setPlaceholder('Kanal ID veya boş bırak').setRequired(false);
            modal.addComponents(new ActionRowBuilder().addComponents(kanalInput));
            return interaction.showModal(modal);
        }

        if (interaction.customId === 'open_role_modal') {
            const modal = new ModalBuilder().setCustomId('role_modal').setTitle('Rol Paneli Ayarları');
            const rolInput = new TextInputBuilder().setCustomId('role_id').setLabel('Verilecek Rolün ID si').setStyle(TextInputStyle.Short).setPlaceholder('Örn: 123456789012345678').setRequired(true);
            const yaziInput = new TextInputBuilder().setCustomId('button_text').setLabel('Butonda Yazacak Metin').setStyle(TextInputStyle.Short).setPlaceholder('Örn: Rolü Al / Bırak').setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(rolInput), new ActionRowBuilder().addComponents(yaziInput));
            return interaction.showModal(modal);
        }

        if (interaction.customId === 'open_embed_modal') {
            const modal = new ModalBuilder().setCustomId('embed_modal').setTitle('Duyuru Embed Oluşturucu');
            const baslikInput = new TextInputBuilder().setCustomId('embed_title').setLabel('Embed Başlığı').setStyle(TextInputStyle.Short).setPlaceholder('Örn: Önemli Duyuru').setRequired(true);
            const aciklamaInput = new TextInputBuilder().setCustomId('embed_desc').setLabel('İçerik / Açıklama').setStyle(TextInputStyle.Paragraph).setPlaceholder('Duyuru metnini buraya yazın...').setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(baslikInput), new ActionRowBuilder().addComponents(aciklamaInput));
            return interaction.showModal(modal);
        }

        // Rol Alma Butonu Tetikleyicisi
        if (interaction.customId.startsWith('role_')) {
            const rolId = interaction.customId.split('_')[1];
            const member = interaction.member;
            const rol = interaction.guild.roles.cache.get(rolId);

            if (!rol) return interaction.reply({ content: 'Rol sistemde bulunamadı!', ephemeral: true });

            if (member.roles.cache.has(rolId)) {
                await member.roles.remove(rolId);
                return interaction.reply({ content: `Üzerinden **${rol.name}** rolü başarıyla alındı!`, ephemeral: true });
            } else {
                await member.roles.add(rolId);
                return interaction.reply({ content: `Üzerine **${rol.name}** rolü başarıyla eklendi!`, ephemeral: true });
            }
        }

        // Çekilişe Katılma Butonu
        if (interaction.customId === 'join_giveaway') {
            return interaction.reply({ content: '🎉 Çekilişe başarıyla katıldın! Bol şans.', ephemeral: true });
        }

        // Ticket Açma Butonu
        if (interaction.customId === 'create_ticket') {
            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;
            const member = interaction.user;
            const channelName = `ticket-${member.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            
            const existingChannel = guild.channels.cache.find(c => c.name === channelName);
            if (existingChannel) {
                return interaction.editReply({ content: `Zaten açık olan bir destek talebin bulunuyor: ${existingChannel}` });
            }

            try {
                const ticketChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                    ],
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setColor('#2f3136')
                    .setTitle('P L A T İN • Destek Talebi')
                    .setDescription('Destek ekibimiz en kısa sürede seninle ilgilenecektir.\nLütfen sorununuzu detaylıca yazın.');

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('Ticket Kapat / Close').setStyle(ButtonStyle.Secondary).setEmoji('🔒')
                );

                await ticketChannel.send({ content: `<@${member.id}>`, embeds: [welcomeEmbed], components: [closeRow] });
                await interaction.editReply({ content: `Destek kanalın oluşturuldu: ${ticketChannel}` });
            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: 'Kanal oluşturulurken yetki hatası oluştu.' });
            }
        }

        // Ticket Kapatma Butonu
        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: 'Destek talebi 5 saniye içinde kapatılıyor...', ephemeral: true });
            setTimeout(() => {
                interaction.channel.delete().catch(err => console.error(err));
            }, 5000);
        }
    }

    // 3. Formlar (Modals) Gönderildiğinde İşlemleri Gerçekleştirme
    if (interaction.isModalSubmit()) {
        // Çekiliş Formu İşleme
        if (interaction.customId === 'giveaway_modal') {
            const odul = interaction.fields.getTextInputValue('giveaway_prize');
            const sureDakika = parseInt(interaction.fields.getTextInputValue('giveaway_time'));

            if (isNaN(sureDakika)) {
                return interaction.reply({ content: 'Hata: Süre kısmına geçerli bir sayı yazmalısın!', ephemeral: true });
            }

            const bitisZamani = Date.now() + (sureDakika * 60 * 1000);

            const embed = new EmbedBuilder()
                .setColor('#ffd700')
                .setTitle('🎉 P L A T İN • ÇEKİLİŞ BAŞLADI! 🎉')
                .setDescription(`Ödül: **${odul}**\n\nKatılmak için aşağıdaki **🎉 Katıl** butonuna bas!\nBitiş: <t:${Math.floor(bitisZamani / 1000)}:R>`)
                .setFooter({ text: `Başlatan: ${interaction.user.tag}` });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('join_giveaway').setLabel('Katıl').setStyle(ButtonStyle.Success).setEmoji('🎉')
            );

            await interaction.reply({ content: 'Çekiliş başarıyla yayınlandı!', ephemeral: true });
            await interaction.channel.send({ embeds: [embed], components: [row] });
        }

        // Ticket Kurulum Formu İşleme
        if (interaction.customId === 'ticket_modal') {
            const kanalId = interaction.fields.getTextInputValue('ticket_channel_id');
            let hedefKanal = interaction.channel;

            if (kanalId) {
                const bulunanKanal = interaction.guild.channels.cache.get(kanalId);
                if (bulunanKanal) hedefKanal = bulunanKanal;
            }

            const embed = new EmbedBuilder()
                .setColor('#2f3136')
                .setAuthor({ name: 'P L A T İN #12K • Ticket', iconURL: client.user.displayAvatarURL() })
                .setDescription('🇹🇷 · Ticket açmak için aşağıdaki **butonuna tıklayınız**.\n\n🇬🇧 · To create a support request, please **click the button below**.')
                .setThumbnail(client.user.displayAvatarURL());

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('create_ticket').setLabel('Create Ticket').setStyle(ButtonStyle.Danger).setEmoji('❓')
            );

            await hedefKanal.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: `Ticket paneli başarıyla ${hedefKanal} kanalına kuruldu!`, ephemeral: true });
        }

        // Rol Kurulum Formu İşleme
        if (interaction.customId === 'role_modal') {
            const rolId = interaction.fields.getTextInputValue('role_id');
            const butonYazi = interaction.fields.getTextInputValue('button_text');
            const rol = interaction.guild.roles.cache.get(rolId);

            if (!rol) {
                return interaction.reply({ content: 'Hata: Girdiğin ID ile eşleşen bir rol bulunamadı!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#2f3136')
                .setTitle('🎭 P L A T İN • Rol Seçim Paneli')
                .setDescription(`Aşağıdaki butona tıklayarak **${rol.name}** rolünü alabilir veya bırakabilirsin!`);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`role_${rol.id}`).setLabel(butonYazi).setStyle(ButtonStyle.Primary).setEmoji('📌')
            );

            await interaction.reply({ content: 'Rol paneli başarıyla oluşturuldu!', ephemeral: true });
            await interaction.channel.send({ embeds: [embed], components: [row] });
        }

        // Duyuru/Embed Formu İşleme
        if (interaction.customId === 'embed_modal') {
            const baslik = interaction.fields.getTextInputValue('embed_title');
            const aciklama = interaction.fields.getTextInputValue('embed_desc');

            const embed = new EmbedBuilder()
                .setColor('#2f3136')
                .setTitle(baslik)
                .setDescription(aciklama)
                .setTimestamp()
                .setFooter({ text: 'P L A T İN Duyuru Sistemi', iconURL: client.user.displayAvatarURL() });

            await interaction.reply({ content: 'Embed başarıyla bu kanala gönderildi!', ephemeral: true });
            await interaction.channel.send({ embeds: [embed] });
        }
    }
});

client.login(TOKEN);
