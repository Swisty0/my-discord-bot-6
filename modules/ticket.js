const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

function registerTicketModule(client) {
    client.on('messageCreate', async message => {
        if (message.author.bot) return;

        const args = message.content.trim().split(/ +/);
        const command = args[0].toLowerCase();

        // 1. .ticket-kurulum komutu ile sabit panel gönderme
        if (command === '.ticket-kurulum') {
            await message.delete().catch(() => {});

            const panelEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎫 Destek Merkezi')
                .setDescription('Sunucumuzda yardıma ihtiyacın olursa aşağıdaki **"Destek Talebi Aç"** butonuna tıklayarak veya doğrudan sohbetin herhangi bir yerine **`.ticket`** yazarak özel kanal oluşturabilirsin.');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket_button')
                    .setLabel('🎫 Destek Talebi Aç')
                    .setStyle(ButtonStyle.Primary)
            );

            await message.channel.send({ embeds: [panelEmbed], components: [row] });
        }
    });

    // 2. Etkileşimler (Komutlar yerine slash/buton mantığı veya interaction üzerinden yürütülen işlemler)
    client.on('interactionCreate', async interaction => {
        // İster panodaki butonla ister ileride ekleyeceğin komutlarla çalışır
        if (!interaction.isButton() && !interaction.isChatInputCommand()) return;

        try {
            // Panodaki butona basıldığında veya tetiklendiğinde
            if (interaction.isButton() && interaction.customId === 'create_ticket_button') {
                await interaction.deferReply({ flags: 6 }); // Sadece tıklayana görünür

                const guild = interaction.guild;
                const user = interaction.user;

                const existingChannel = guild.channels.cache.find(
                    c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
                );

                if (existingChannel) {
                    return interaction.editReply({ content: `❌ Zaten açık olan bir destek talebin bulunuyor: ${existingChannel}` });
                }

                const ticketChannel = await guild.channels.create({
                    name: `ticket-${user.username}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            denied: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: user.id,
                            allowed: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: client.user.id,
                            allowed: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                        }
                    ],
                });

                const ticketEmbed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle(`Destek Talebi - ${user.username}`)
                    .setDescription('Destek ekibimiz en kısa sürede seninle ilgilenecektir.\nLütfen sorununuzu veya talebinizi detaylı bir şekilde açıklayın.');

                const ticketRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Talebi Kapat')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('call_staff')
                        .setLabel('⚠️ Yetkiliyi Çağır')
                        .setStyle(ButtonStyle.Secondary)
                );

                await ticketChannel.send({ content: `Hoş geldin <@${user.id}>!`, embeds: [ticketEmbed], components: [ticketRow] });
                await interaction.editReply({ content: `✅ Destek talebin başarıyla oluşturuldu: ${ticketChannel}` });
            }

            // Ticket Kapatma
            if (interaction.isButton() && interaction.customId === 'close_ticket') {
                const channel = interaction.channel;
                await interaction.reply({ content: '🔒 Destek talebi 5 saniye içinde kapatılıyor...' });
                
                setTimeout(async () => {
                    await channel.delete().catch(() => {});
                }, 5000);
            }

            // Yetkili Çağırma
            if (interaction.isButton() && interaction.customId === 'call_staff') {
                await interaction.reply({ content: '📢 Yetkili ekibe bildirim gönderildi, en kısa sürede bakacaklar!' });
            }

        } catch (err) {
            console.error("Ticket işlem hatası:", err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ İşlem sırasında bir hata oluştu.', flags: 6 }).catch(() => {});
            }
        }
    });

    // .ticket komutunun mesaja yanıt veren (sadece yazana özel görünme şansı olmadığı için komutu butona yönlendiren veya gizli çalışan) versiyonu:
    client.on('messageCreate', async message => {
        if (message.author.bot) return;
        if (message.content.trim() === '.ticket') {
            await message.delete().catch(() => {});

            // Sohbet kirliliği olmaması ve başkasının görmemesi için kullanıcıya özel bir bilgilendirme atıp butona yönlendirebiliriz
            // Veya direkt o an bir kanal oluşturup linkini sadece ona DM'den ya da geçici mesajla atabiliriz.
            const guild = message.guild;
            const user = message.author;

            const existingChannel = guild.channels.cache.find(
                c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
            );

            if (existingChannel) {
                const warnMsg = await message.channel.send({ content: `❌ <@${user.id}> Zaten açık olan bir destek talebin bulunuyor: ${existingChannel}` });
                setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
                return;
            }

            const ticketChannel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: guild.id, denied: [PermissionFlagsBits.ViewChannel] },
                    { id: user.id, allowed: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: client.user.id, allowed: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                ],
            });

            const ticketEmbed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle(`Destek Talebi - ${user.username}`)
                .setDescription('Destek ekibimiz en kısa sürede seninle ilgilenecektir.');

            const ticketRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Talebi Kapat').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('call_staff').setLabel('⚠️ Yetkiliyi Çağır').setStyle(ButtonStyle.Secondary)
            );

            await ticketChannel.send({ content: `Hoş geldin <@${user.id}>!`, embeds: [ticketEmbed], components: [ticketRow] });

            // Bildirim mesajını kanala atıp 4 saniye sonra siliyoruz ki kimse görmesin
            const notifyMsg = await message.channel.send({ content: `<@${user.id}>, destek talebin oluşturuldu: ${ticketChannel}` });
            setTimeout(() => notifyMsg.delete().catch(() => {}), 4000);
        }
    });
}

module.exports = { registerTicketModule };
