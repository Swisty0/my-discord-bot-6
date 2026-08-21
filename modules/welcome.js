const { EmbedBuilder } = require('discord.js');

function registerWelcomeModule(client) {
    // Karşılama kanalının ID'sini buraya yazmalısın
    const channelId = '1538172396941479966'; 
    // Tavşanlı sevimli banner görselin
    const bannerUrl = 'https://cdn.discordapp.com/attachments/1538172275084239019/1540358401249386516/b7c7b8350233039c87e1c8f2b63535c7.jpg?ex=6a89aa0d&is=6a88588d&hm=6cf3c587d478fd4089df6b56798f59211f177db501e3bf4e402d1583c29714a1&';

    client.on('guildMemberAdd', async member => {
        try {
            const channel = member.guild.channels.cache.get(channelId);
            if (!channel) return;

            const embed = new EmbedBuilder()
                .setColor('#ffb6c1') // Pastel pembe
                .setTitle('🌸 Sunucumuza Hoş Geldin!')
                .setDescription(
                    `Selam ${member}!\n\n` +
                    `Aramıza katıldığın için çok mutlu olduk. Seninle birlikte **${member.guild.memberCount}** kişi olduk! ✨\n\n` +
                    `İyi vakit geçirmen dileğiyle, kurallara göz atmayı unutma! 💖`
                )
                .setImage(bannerUrl)
                .setFooter({ text: `${member.guild.name} — Karşılama Sistemi`, iconURL: member.guild.iconURL() })
                .setTimestamp();

            await channel.send({ content: `${member}`, embeds: [embed] });
        } catch (err) {
            console.error('Welcome mesajı gönderilirken hata oluştu:', err);
        }
    });
}

module.exports = { registerWelcomeModule };
