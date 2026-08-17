const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

function registerCopyModule(client) {
    // 1. Sunucu Kopyalama Paneli Komutu (!kopyala)
    client.on('messageCreate', async message => {
        if (message.author.bot) return;
        if (message.content === '!kopyala') {
            const embed = new EmbedBuilder()
                .setColor('#ef4444')
                .setTitle('🧬 Sunucu Kopyalama Sistemi')
                .setDescription(
                    'Kaynak sunucunun rollerini ve kanallarını hedef sunucuya hızlı bir şekilde aktarın.\n' +
                    'İşlem başlamadan önce botun her iki sunucuda da yönetici yetkisine sahip olduğundan emin olun.'
                )
                .addFields({
                    name: '💙 Özellikler',
                    value: 
                        '» **Sunucu Kopyala:** Kaynak ve hedef ID bilgileriyle kopyalama sihirbazını başlatır'
                })
                .setFooter({ text: 'Project Swisty Sunucu Kopyalama Sistemi' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_kopya_sec').setLabel('Sunucu Kopyalama Sihirbazı').setStyle(ButtonStyle.Success).setEmoji('⚡')
            );

            await message.channel.send({ embeds: [embed], components: [row] });
        }
    });

    // 2. Etkileşim Yöneticisi (Buton ve Modal)
    client.on('interactionCreate', async interaction => {
        if (interaction.isButton() && interaction.customId === 'btn_kopya_sec') {
            const modal = new ModalBuilder().setCustomId('modal_server_copy').setTitle('Sunucu Kopyalama Bilgileri');
            
            const kaynak = new TextInputBuilder()
                .setCustomId('input_kaynak')
                .setLabel('Kaynak Sunucu ID')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const hedef = new TextInputBuilder()
                .setCustomId('input_hedef')
                .setLabel('Hedef Sunucu ID')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(kaynak), 
                new ActionRowBuilder().addComponents(hedef)
            );

            await interaction.showModal(modal);
        }
        else if (interaction.isModalSubmit() && interaction.customId === 'modal_server_copy') {
            const kaynak = interaction.fields.getTextInputValue('input_kaynak');
            const hedef = interaction.fields.getTextInputValue('input_hedef');
            
            await interaction.reply({ 
                content: `🧬 **Project Swisty:** Sunucu kopyalama işlemi başarıyla kuyruğa alındı!\n\n• **Kaynak Sunucu:** \`${kaynak}\`\n• **Hedef Sunucu:** \`${hedef}\``, 
                ephemeral: true 
            });
        }
    });
}

module.exports = { registerCopyModule };