import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, Clock } from "lucide-react";

export default function Contact() {
  return (
    <SubPageLayout>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-full px-4 py-2 mb-6">
            <MessageSquare className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-[#A1A1AA]">Contact</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Parlons de{" "}
            <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
              ton projet
            </span>
          </h1>
          <p className="text-lg text-[#A1A1AA]">
            Une question, un bug, une suggestion ? On répond en moins de 24h.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#18181B] border border-[#27272A] rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-6">Envoyer un message</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-1.5">Nom</label>
                <input
                  type="text"
                  placeholder="Ton nom"
                  className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#52525B] focus:outline-none focus:border-orange-400/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="ton@email.com"
                  className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#52525B] focus:outline-none focus:border-orange-400/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-1.5">Sujet</label>
                <select className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-400/50 transition-colors">
                  <option value="question">Question générale</option>
                  <option value="bug">Signaler un bug</option>
                  <option value="feature">Suggestion de fonctionnalité</option>
                  <option value="billing">Question de facturation</option>
                  <option value="partnership">Partenariat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#A1A1AA] mb-1.5">Message</label>
                <textarea
                  rows={4}
                  placeholder="Décris ta demande..."
                  className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#52525B] focus:outline-none focus:border-orange-400/50 transition-colors resize-none"
                />
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-400 transition-colors">
                <Send className="w-4 h-4" />
                Envoyer
              </button>
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6">
              <Mail className="w-6 h-6 text-orange-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Email direct</h3>
              <p className="text-sm text-[#A1A1AA] mb-2">support@minia-ia.com</p>
              <p className="text-xs text-[#52525B]">Pour les questions urgentes, préférez le formulaire.</p>
            </div>

            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6">
              <Clock className="w-6 h-6 text-orange-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Temps de réponse</h3>
              <p className="text-sm text-[#A1A1AA] mb-2">Moins de 24h ouvrées</p>
              <p className="text-xs text-[#52525B]">Nous répondons du lundi au vendredi, 9h-18h CET.</p>
            </div>

            <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6">
              <MessageSquare className="w-6 h-6 text-orange-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Communauté</h3>
              <p className="text-sm text-[#A1A1AA] mb-2">Rejoins notre Discord</p>
              <p className="text-xs text-[#52525B]">Échange avec d'autres créateurs et obtiens de l'aide rapide.</p>
            </div>

            <div className="bg-gradient-to-r from-orange-400/10 to-orange-300/10 border border-orange-400/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-1">FAQ rapide</h3>
              <p className="text-sm text-[#A1A1AA] mb-3">Ta question a peut-être déjà une réponse.</p>
              <a href="/faq" className="text-sm text-orange-400 hover:underline">Voir la FAQ →</a>
            </div>
          </motion.div>
        </div>
      </div>
    </SubPageLayout>
  );
}
