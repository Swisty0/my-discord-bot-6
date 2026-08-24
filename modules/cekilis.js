const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const giveaways = new Map();

function registerCekilisModule(client) {
    // 1. .çekiliş yazıldığında yönetim paneli butonunu gönderir
    client.on('messageCreate', async message => {
        if (message.author.bot) return;

        if (message.content.trim() === '.çekiliş') {
            await message.delete().catch(() => {});

            const panelEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('🛠️ Çekiliş Yönetim Paneli')
                .setDescription('Aşağıdaki **"Çekiliş Başlat"** butonuna tıklayarak açılan pencereden başlığı, ödülü, açıklamayı, süreyi ve kazanan sayısını kolayca belirleyebilirsin.');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('open_giveaway_modal')
                    .setLabel('🎁 Çekiliş Başlat')
                    .setStyle(ButtonStyle.Success)
            );

            await message.channel.send({ embeds: [panelEmbed], components: [row] });
        }
    });

    // 2. Tüm etkileşimler (Butonlar ve Modaller)
    client.on('interactionCreate', async interaction => {
        try {
            // "Çekiliş Başlat" butonuna basıldığında modal formunu açar
            if (interaction.isButton() && interaction.customId === 'open_giveaway_modal') {
                const modal = new ModalBuilder()
                    .setCustomId('giveaway_modal')
                    .setTitle('🎉 Gelişmiş Çekiliş Oluşturucu');

                const titleInput = new TextInputBuilder()
                    .setCustomId('giveaway_title')
                    .setLabel('Çekiliş Başlığı')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Örn: 🎉 DEV ÇEKİLİŞ 🎉')
                    .setRequired(true);

                const prizeInput = new TextInputBuilder()
                    .setCustomId('giveaway_prize')
                    .setLabel('Ödül Nedir?')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Örn: Discord Nitro')
                    .setRequired(true);

                const descInput = new TextInputBuilder()
                    .setCustomId('giveaway_desc')
                    .setLabel('Açıklama / Kurallar')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Katılım şartları veya ek açıklamalar...')
                    .setRequired(false);

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
                    new ActionRowBuilder().addComponents(titleInput),
                    new ActionRowBuilder().addComponents(prizeInput),
                    new ActionRowBuilder().addComponents(descInput),
                    new ActionRowBuilder().addComponents(durationInput),
                    new ActionRowBuilder().addComponents(winnersInput)
                );

                return await interaction.showModal(modal);
            }

            // Modal gönderildiğinde (Submit)
            if (interaction.isModalSubmit() && interaction.customId === 'giveaway_modal') {
                await interaction.deferReply({ flags: 6 });

                const title = interaction.fields.getTextInputValue('giveaway_title');
                const prize = interaction.fields.getTextInputValue('giveaway_prize');
                const description = interaction.fields.getTextInputValue('giveaway_desc') || 'Ek açıklama bulunmuyor.';
                const color = '#5865F2';

                const durationMinutes = parseInt(interaction.fields.getTextInputValue('giveaway_duration'));
                const winnerCount = parseInt(interaction.fields.getTextInputValue('giveaway_winners'));

                if (isNaN(durationMinutes) || isNaN(winnerCount)) {
                    return interaction.editReply({ content: '❌ Süre ve kazanan sayısı sadece sayı olmalıdır!' });
                }

                const endTime = Date.now() + (durationMinutes * 60 * 1000);
                const endsTimestamp = Math.floor(endTime / 1000);

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle(title)
                    .setDescription(`${description}\n\n🎁 **Ödül:** **${prize}**\n👑 **Kazanan Sayısı:** \`${winnerCount} Kişi\`\n⏰ **Bitiş Zamanı:** <t:${endsTimestamp}:R>`)
                    .setFooter({ text: `${interaction.user.tag} tarafından düzenleniyor`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp(endTime);

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
                    ended: false,
                    title
                });

                await interaction.editReply({ content: '✅ Çekiliş başarıyla başlatıldı!' });

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
                            .setTitle(`🎉 **${title} - SONUÇLANDI** 🎉`)
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

                        await msg.edit({ embeds: [endedEmbed], components: [disabledRow] }).catch(() => {});
                        await interaction.channel.send({ content: `🎉 Tebrikler ${winnersText}! **${prize}** ödülünü kazandın!` });
                    }
                }, 5000);
            }

            // Katılma ve Oranları Görme Butonları (Sadece kişiye özel görünür - Ephemeral)
            if (interaction.isButton() && interaction.customId !== 'open_giveaway_modal') {
                const giveaway = giveaways.get(interaction.message.id);

                if (interaction.customId === 'join_giveaway') {
                    if (!giveaway || giveaway.ended) {
                        return interaction.reply({ content: '❌ Bu çekiliş sona ermiş!', flags: 6 });
                    }

                    if (giveaway.participants.has(interaction.user.id)) {
                        giveaway.participants.delete(interaction.user.id);
                        const oldRow = interaction.message.components[0];
                        const newButton = ButtonBuilder.from(oldRow.components[0]).setLabel(`🎉 Çekilişe Katıl (${giveaway.participants.size})`);
                        const newRow = new ActionRowBuilder().addComponents(newButton, oldRow.components[1]);

                        await interaction.message.edit({ components: [newRow] });
                        // Sadece butona basana görünür, sohbete gitmez
                        return interaction.reply({ content: '❌ Çekilişten başarıyla çıkış yaptın!', flags: 6 });
                    } else {
                        giveaway.participants.add(interaction.user.id);
                        const oldRow = interaction.message.components[0];
                        const newButton = ButtonBuilder.from(oldRow.components[0]).setLabel(`🎉 Çekilişe Katıl (${giveaway.participants.size})`);
                        const newRow = new ActionRowBuilder().addComponents(newButton, oldRow.components[1]);

                        await interaction.message.edit({ components: [newRow] });
                        // Sadece butona basana görünür, sohbete gitmez
                        return interaction.reply({ content: '✅ Başarıyla çekilişe katıldın!', flags: 6 });
                    }
                }

                if (interaction.customId === 'giveaway_stats') {
                    if (!giveaway) {
                        return interaction.reply({ content: '❌ Bu çekilişe ait veri bulunamadı.', flags: 6 });
                    }

                    const totalParticipants = giveaway.participants.size;
                    let winChance = '0%';
                    if (totalParticipants > 0) {
                        winChance = ((giveaway.winnerCount / totalParticipants) * 100).toFixed(1) + '%';
                    }

                    return interaction.reply({
                        content: `📊 **Çekiliş İstatistikleri:**\n- 👥 Toplam Katılımcı: **${totalParticipants} kişi**\n- 👑 Kazanacak Kişi: **${giveaway.winnerCount} kişi**\n- 🍀 Kazanma Oranın: **${winChance}**`,
                        flags: 6
                    });
                }
            }
        } catch (err) {
            console.error("Çekiliş etkileşim hatası:", err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ İşlem sırasında bir hata oluştu.', flags: 6 }).catch(() => {});
            }
        }
    });
}

module.exports = { registerCekilisModule };
