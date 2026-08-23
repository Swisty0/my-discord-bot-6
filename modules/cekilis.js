const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const giveaways = new Map();

function registerCekilisModule(client) {
    client.on('messageCreate', async message => {
        if (message.author.bot) return;

        // .çekiliş yazıldığında kullanıcıya modal (açılır form) açtırıyoruz
        if (message.content.trim() === '.çekiliş') {
            const modal = new ModalBuilder()
                .setCustomId('giveaway_modal')
                .setTitle('🎉 Çekiliş Oluşturma Paneli');

            const prizeInput = new TextInputBuilder()
                .setCustomId('giveaway_prize')
                .setLabel('Ödül Nedir?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Örn: Discord Nitro / 100M Para')
                .setRequired(true);

            const durationInput = new TextInputBuilder()
                .setCustomId('giveaway_duration')
                .setLabel('Süre (Dakika olarak)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Örn: 5')
                .setRequired(true);

            const winnersInput = new TextInputBuilder()
                .setCustomId('giveaway_winners')
                .setLabel('Kaç Kişi Kazansın?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Örn: 1')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(prizeInput),
                new ActionRowBuilder().addComponents(durationInput),
                new ActionRowBuilder().addComponents(winnersInput)
            );

            // Mesajı silip modalı tetikleyemeyiz doğrudan mesaj üzerinden modal açılmaz, 
            // bunun yerine kullanıcıya butonlu bir panel mesajı atabiliriz veya modal açtıran komut yapabiliriz.
            // Discord API gereği mesajlar doğrudan modal açamaz, buton gerektirir!
        }
    });

    // Bu yüzden .çekiliş yazıldığında direkt "Çekiliş Oluştur" butonu içeren bir panel atalım:
    client.on('messageCreate', async message => {
        if (message.author.bot) return;

        if (message.content.trim() === '.çekiliş') {
            await message.delete().catch(() => {});

            const panelEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('🛠️ Çekiliş Yönetim Paneli')
                .setDescription('Aşağıdaki **"Çekiliş Başlat"** butonuna tıklayarak açılan pencereden ödülü, süreyi ve kazanan sayısını kolayca belirleyebilirsin.');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('open_giveaway_modal')
                    .setLabel('🎁 Çekiliş Başlat')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('active_giveaways_info')
                    .setLabel('📊 Aktif Çekilişler / İstatistik')
                    .setStyle(ButtonStyle.Secondary)
            );

            await message.channel.send({ embeds: [panelEmbed], components: [row] });
        }
    });

    // Buton ve Modal Etkileşimleri
    client.on('interactionCreate', async interaction => {
        // 1. "Çekiliş Başlat" butonuna basıldığında Modal aç
        if (interaction.isButton() && interaction.customId === 'open_giveaway_modal') {
            const modal = new ModalBuilder()
                .setCustomId('giveaway_modal')
                .setTitle('🎉 Çekiliş Oluşturma Paneli');

            const prizeInput = new TextInputBuilder()
                .setCustomId('giveaway_prize')
                .setLabel('Ödül Nedir?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Örn: Discord Nitro')
                .setRequired(true);

            const durationInput = new TextInputBuilder()
                .setCustomId('giveaway_duration')
                .setLabel('Süre (Dakika)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('5')
                .setRequired(true);

            const winnersInput = new TextInputBuilder()
                .setCustomId('giveaway_winners')
                .setLabel('Kazanan Kişi Sayısı')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('1')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(prizeInput),
                new ActionRowBuilder().addComponents(durationInput),
                new ActionRowBuilder().addComponents(winnersInput)
            );

            return interaction.showModal(modal);
        }

        // 2. Modal doldurulup gönderildiğinde çekilişi başlat
        if (interaction.type === 4 && interaction.customId === 'giveaway_modal') { // Modal submit
            // Discord.js v14 modal submit kontrolü:
        }
    });

    // Modal Submit ve Buton Yönetimi için güncellenmiş dinleyici:
    client.on('interactionCreate', async interaction => {
        if (interaction.isModalSubmit() && interaction.customId === 'giveaway_modal') {
            const prize = interaction.fields.getTextInputValue('giveaway_prize');
            const durationMinutes = parseInt(interaction.fields.getTextInputValue('giveaway_duration'));
            const winnerCount = parseInt(interaction.fields.getTextInputValue('giveaway_winners'));

            if (isNaN(durationMinutes) || isNaN(winnerCount)) {
                return interaction.reply({ content: '❌ Süre ve kazanan sayısı sadece sayı olmalıdır!', ephemeral: true });
            }

            const endTime = Date.now() + (durationMinutes * 60 * 1000);
            const endsTimestamp = Math.floor(endTime / 1000);

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎉 **ÇEKİLİŞ BAŞLADI!** 🎉')
                .setDescription(`Aşağıdaki butona basarak çekilişe katılabilirsin!\n\n🎁 **Ödül:** **${prize}**\n👑 **Kazanan Sayısı:** \`${winnerCount} Kişi\`\n⏰ **Bitiş Zamanı:** <t:${endsTimestamp}:R>`)
                .setFooter({ text: `${interaction.user.tag} tarafından düzenleniyor`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp(endTime);

            // Katıl butonu + Detay / Oranları Göster butonu yan yana
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('join_giveaway')
                    .setLabel('🎉 Çekilişe Katıl (0)')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('giveaway_stats')
                    .setLabel('📊 Durum & Oranlar')
                    .setStyle(ButtonStyle.Secondary)
            );

            const msg = await interaction.channel.send({ embeds: [embed], components: [row] });
            const participants = new Set();

            giveaways.set(msg.id, {
                prize,
                winnerCount,
                participants,
                endTime,
                host: interaction.user.id,
                ended: false
            });

            await interaction.reply({ content: '✅ Çekiliş başarıyla başlatıldı!', ephemeral: true });

            // Süre bitim kontrolü
            const interval = setInterval(async () => {
                const giveaway = giveaways.get(msg.id);
                if (!giveaway || giveaway.ended) {
                    clearInterval(interval);
                    return;
                }

                if (Date.now() >= giveaway.endTime) {
                    giveaway.ended = true;
                    clearInterval(interval);

                    const participantArray = Array.from(giveaway.participants);
                    let winnersText = "";

                    if (participantArray.length === 0) {
                        winnersText = "Hiç kimse katımadığı için çekiliş iptal edildi! 😢";
                    } else {
                        const winners = [];
                        const count = Math.min(winnerCount, participantArray.length);
                        for (let i = 0; i < count; i++) {
                            const randomIndex = Math.floor(Math.random() * participantArray.length);
                            winners.push(participantArray.splice(randomIndex, 1)[0]);
                        }
                        winnersText = winners.map(id => `<@${id}>`).join(', ');
                    }

                    const endedEmbed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setTitle('🎉 **ÇEKİLİŞ SONUÇLANDI** 🎉')
                        .setDescription(`🎁 **Ödül:** **${prize}**\n👑 **Kazananlar:** ${winnersText}`)
                        .setTimestamp();

                    const disabledRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('join_giveaway')
                            .setLabel('Çekiliş Sona Erdi')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('giveaway_stats')
                            .setLabel('📊 Durum & Oranlar')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );

                    await msg.edit({ embeds: [endedEmbed], components: [disabledRow] });
                    await interaction.channel.send({ content: `🎉 Tebrikler ${winnersText}! **${prize}** ödülünü kazandın!` });
                }
            }, 5000);
        }

        // 3. Katılma / Çıkma ve İstatistik butonlarının yönetimi
        if (interaction.isButton()) {
            const giveaway = giveaways.get(interaction.message.id);

            if (interaction.customId === 'join_giveaway') {
                if (!giveaway || giveaway.ended) {
                    return interaction.reply({ content: '❌ Bu çekiliş sona ermiş!', ephemeral: true });
                }

                if (giveaway.participants.has(interaction.user.id)) {
                    giveaway.participants.delete(interaction.user.id);
                    const oldRow = interaction.message.components[0];
                    const newButton = ButtonBuilder.from(oldRow.components[0]).setLabel(`🎉 Çekilişe Katıl (${giveaway.participants.size})`);
                    const newRow = new ActionRowBuilder().addComponents(newButton, oldRow.components[1]);

                    await interaction.message.edit({ components: [newRow] });
                    return interaction.reply({ content: '❌ Çekilişten başarıyla çıkış yaptın!', ephemeral: true });
                } else {
                    giveaway.participants.add(interaction.user.id);
                    const oldRow = interaction.message.components[0];
                    const newButton = ButtonBuilder.from(oldRow.components[0]).setLabel(`🎉 Çekilişe Katıl (${giveaway.participants.size})`);
                    const newRow = new ActionRowBuilder().addComponents(newButton, oldRow.components[1]);

                    await interaction.message.edit({ components: [newRow] });
                    return interaction.reply({ content: '✅ Başarıyla çekilişe katıldın!', ephemeral: true });
                }
            }

            // Kazanma Oranı ve Detaylar Butonu
            if (interaction.customId === 'giveaway_stats') {
                if (!giveaway) {
                    return interaction.reply({ content: '❌ Bu çekilişe ait veri bulunamadı.', ephemeral: true });
                }

                const totalParticipants = giveaway.participants.size;
                let winChance = '0%';
                if (totalParticipants > 0) {
                    winChance = ((giveaway.winnerCount / totalParticipants) * 100).toFixed(1) + '%';
                }

                return interaction.reply({
                    content: `📊 **Çekiliş İstatistikleri & Bilgileri:**\n- 🎁 Ödül: **${giveaway.prize}**\n- 👥 Toplam Katılımcı: **${totalParticipants} kişi**\n- 👑 Kazanacak Kişi: **${giveaway.winnerCount} kişi**\n- 🍀 Tek Kişilik Kazanma Oranı: **${winChance}**`,
                    ephemeral: true
                });
            }
        }
    });
}

module.exports = { registerCekilisModule };
