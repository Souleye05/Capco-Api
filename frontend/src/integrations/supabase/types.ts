export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      actions_recouvrement: {
        Row: {
          created_at: string
          created_by: string
          date: string
          dossier_id: string
          echeance_prochaine_etape: string | null
          id: string
          piece_jointe: string | null
          prochaine_etape: string | null
          resume: string
          type_action: Database["public"]["Enums"]["type_action"]
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          dossier_id: string
          echeance_prochaine_etape?: string | null
          id?: string
          piece_jointe?: string | null
          prochaine_etape?: string | null
          resume: string
          type_action: Database["public"]["Enums"]["type_action"]
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          dossier_id?: string
          echeance_prochaine_etape?: string | null
          id?: string
          piece_jointe?: string | null
          prochaine_etape?: string | null
          resume?: string
          type_action?: Database["public"]["Enums"]["type_action"]
        }
        Relationships: [
          {
            foreignKeyName: "actions_recouvrement_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers_recouvrement"
            referencedColumns: ["id"]
          },
        ]
      }
      affaires: {
        Row: {
          chambre: string
          created_at: string
          created_by: string
          defendeurs: Json
          demandeurs: Json
          id: string
          intitule: string
          juridiction: string
          notes: string | null
          reference: string
          statut: Database["public"]["Enums"]["statut_affaire"]
          updated_at: string
        }
        Insert: {
          chambre: string
          created_at?: string
          created_by: string
          defendeurs?: Json
          demandeurs?: Json
          id?: string
          intitule: string
          juridiction: string
          notes?: string | null
          reference: string
          statut?: Database["public"]["Enums"]["statut_affaire"]
          updated_at?: string
        }
        Update: {
          chambre?: string
          created_at?: string
          created_by?: string
          defendeurs?: Json
          demandeurs?: Json
          id?: string
          intitule?: string
          juridiction?: string
          notes?: string | null
          reference?: string
          statut?: Database["public"]["Enums"]["statut_affaire"]
          updated_at?: string
        }
        Relationships: []
      }
      alertes: {
        Row: {
          created_at: string
          description: string
          id: string
          lien: string | null
          lu: boolean
          priorite: Database["public"]["Enums"]["priorite_alerte"]
          titre: string
          type: Database["public"]["Enums"]["type_alerte"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          lien?: string | null
          lu?: boolean
          priorite?: Database["public"]["Enums"]["priorite_alerte"]
          titre: string
          type: Database["public"]["Enums"]["type_alerte"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          lien?: string | null
          lu?: boolean
          priorite?: Database["public"]["Enums"]["priorite_alerte"]
          titre?: string
          type?: Database["public"]["Enums"]["type_alerte"]
          user_id?: string | null
        }
        Relationships: []
      }
      audiences: {
        Row: {
          affaire_id: string
          created_at: string
          created_by: string
          date: string
          heure: string | null
          id: string
          notes_preparation: string | null
          objet: Database["public"]["Enums"]["objet_audience"]
          statut: Database["public"]["Enums"]["statut_audience"]
        }
        Insert: {
          affaire_id: string
          created_at?: string
          created_by: string
          date: string
          heure?: string | null
          id?: string
          notes_preparation?: string | null
          objet?: Database["public"]["Enums"]["objet_audience"]
          statut?: Database["public"]["Enums"]["statut_audience"]
        }
        Update: {
          affaire_id?: string
          created_at?: string
          created_by?: string
          date?: string
          heure?: string | null
          id?: string
          notes_preparation?: string | null
          objet?: Database["public"]["Enums"]["objet_audience"]
          statut?: Database["public"]["Enums"]["statut_audience"]
        }
        Relationships: [
          {
            foreignKeyName: "audiences_affaire_id_fkey"
            columns: ["affaire_id"]
            isOneToOne: false
            referencedRelation: "affaires"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_reference: string | null
          entity_type: string
          id: string
          module: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_reference?: string | null
          entity_type: string
          id?: string
          module: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_reference?: string | null
          entity_type?: string
          id?: string
          module?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      baux: {
        Row: {
          created_at: string
          created_by: string | null
          date_debut: string
          date_fin: string | null
          id: string
          jour_paiement_prevu: number
          locataire_id: string
          lot_id: string
          montant_loyer: number
          statut: Database["public"]["Enums"]["statut_bail"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_debut: string
          date_fin?: string | null
          id?: string
          jour_paiement_prevu?: number
          locataire_id: string
          lot_id: string
          montant_loyer: number
          statut?: Database["public"]["Enums"]["statut_bail"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin?: string | null
          id?: string
          jour_paiement_prevu?: number
          locataire_id?: string
          lot_id?: string
          montant_loyer?: number
          statut?: Database["public"]["Enums"]["statut_bail"]
        }
        Relationships: [
          {
            foreignKeyName: "baux_locataire_id_fkey"
            columns: ["locataire_id"]
            isOneToOne: false
            referencedRelation: "locataires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baux_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      clients_conseil: {
        Row: {
          adresse: string | null
          created_at: string
          created_by: string
          email: string | null
          honoraire_mensuel: number
          id: string
          jour_facturation: number
          nom: string
          notes: string | null
          reference: string
          statut: Database["public"]["Enums"]["statut_client_conseil"]
          telephone: string | null
          type: Database["public"]["Enums"]["type_partie"]
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          honoraire_mensuel?: number
          id?: string
          jour_facturation?: number
          nom: string
          notes?: string | null
          reference: string
          statut?: Database["public"]["Enums"]["statut_client_conseil"]
          telephone?: string | null
          type?: Database["public"]["Enums"]["type_partie"]
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          honoraire_mensuel?: number
          id?: string
          jour_facturation?: number
          nom?: string
          notes?: string | null
          reference?: string
          statut?: Database["public"]["Enums"]["statut_client_conseil"]
          telephone?: string | null
          type?: Database["public"]["Enums"]["type_partie"]
          updated_at?: string
        }
        Relationships: []
      }
      depenses_affaires: {
        Row: {
          affaire_id: string
          created_at: string
          created_by: string
          date: string
          description: string | null
          id: string
          justificatif: string | null
          montant: number
          nature: string
          type_depense: string
        }
        Insert: {
          affaire_id: string
          created_at?: string
          created_by: string
          date?: string
          description?: string | null
          id?: string
          justificatif?: string | null
          montant?: number
          nature: string
          type_depense: string
        }
        Update: {
          affaire_id?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          id?: string
          justificatif?: string | null
          montant?: number
          nature?: string
          type_depense?: string
        }
        Relationships: [
          {
            foreignKeyName: "depenses_affaires_affaire_id_fkey"
            columns: ["affaire_id"]
            isOneToOne: false
            referencedRelation: "affaires"
            referencedColumns: ["id"]
          },
        ]
      }
      depenses_dossier: {
        Row: {
          created_at: string
          created_by: string
          date: string
          dossier_id: string
          id: string
          justificatif: string | null
          montant: number
          nature: string
          type_depense: Database["public"]["Enums"]["type_depense_dossier"]
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          dossier_id: string
          id?: string
          justificatif?: string | null
          montant: number
          nature: string
          type_depense?: Database["public"]["Enums"]["type_depense_dossier"]
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          dossier_id?: string
          id?: string
          justificatif?: string | null
          montant?: number
          nature?: string
          type_depense?: Database["public"]["Enums"]["type_depense_dossier"]
        }
        Relationships: [
          {
            foreignKeyName: "depenses_dossier_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers_recouvrement"
            referencedColumns: ["id"]
          },
        ]
      }
      depenses_immeubles: {
        Row: {
          created_at: string
          created_by: string
          date: string
          description: string | null
          id: string
          immeuble_id: string
          justificatif: string | null
          montant: number
          nature: string
          type_depense: Database["public"]["Enums"]["type_depense_immeuble"]
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          id?: string
          immeuble_id: string
          justificatif?: string | null
          montant: number
          nature: string
          type_depense?: Database["public"]["Enums"]["type_depense_immeuble"]
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          id?: string
          immeuble_id?: string
          justificatif?: string | null
          montant?: number
          nature?: string
          type_depense?: Database["public"]["Enums"]["type_depense_immeuble"]
        }
        Relationships: [
          {
            foreignKeyName: "depenses_immeubles_immeuble_id_fkey"
            columns: ["immeuble_id"]
            isOneToOne: false
            referencedRelation: "immeubles"
            referencedColumns: ["id"]
          },
        ]
      }
      dossiers_recouvrement: {
        Row: {
          creancier_email: string | null
          creancier_id: string | null
          creancier_nom: string
          creancier_telephone: string | null
          created_at: string
          created_by: string
          debiteur_adresse: string | null
          debiteur_email: string | null
          debiteur_id: string | null
          debiteur_nom: string
          debiteur_telephone: string | null
          id: string
          montant_principal: number
          notes: string | null
          penalites_interets: number | null
          reference: string
          statut: Database["public"]["Enums"]["statut_recouvrement"]
          total_a_recouvrer: number
          updated_at: string
        }
        Insert: {
          creancier_email?: string | null
          creancier_id?: string | null
          creancier_nom: string
          creancier_telephone?: string | null
          created_at?: string
          created_by: string
          debiteur_adresse?: string | null
          debiteur_email?: string | null
          debiteur_id?: string | null
          debiteur_nom: string
          debiteur_telephone?: string | null
          id?: string
          montant_principal: number
          notes?: string | null
          penalites_interets?: number | null
          reference: string
          statut?: Database["public"]["Enums"]["statut_recouvrement"]
          total_a_recouvrer: number
          updated_at?: string
        }
        Update: {
          creancier_email?: string | null
          creancier_id?: string | null
          creancier_nom?: string
          creancier_telephone?: string | null
          created_at?: string
          created_by?: string
          debiteur_adresse?: string | null
          debiteur_email?: string | null
          debiteur_id?: string | null
          debiteur_nom?: string
          debiteur_telephone?: string | null
          id?: string
          montant_principal?: number
          notes?: string | null
          penalites_interets?: number | null
          reference?: string
          statut?: Database["public"]["Enums"]["statut_recouvrement"]
          total_a_recouvrer?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_recouvrement_creancier_id_fkey"
            columns: ["creancier_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_recouvrement_debiteur_id_fkey"
            columns: ["debiteur_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      encaissements_loyers: {
        Row: {
          commission_capco: number
          created_at: string
          created_by: string
          date_encaissement: string
          id: string
          lot_id: string
          mode_paiement: Database["public"]["Enums"]["mode_paiement"]
          mois_concerne: string
          montant_encaisse: number
          net_proprietaire: number
          observation: string | null
        }
        Insert: {
          commission_capco?: number
          created_at?: string
          created_by: string
          date_encaissement: string
          id?: string
          lot_id: string
          mode_paiement: Database["public"]["Enums"]["mode_paiement"]
          mois_concerne: string
          montant_encaisse: number
          net_proprietaire?: number
          observation?: string | null
        }
        Update: {
          commission_capco?: number
          created_at?: string
          created_by?: string
          date_encaissement?: string
          id?: string
          lot_id?: string
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"]
          mois_concerne?: string
          montant_encaisse?: number
          net_proprietaire?: number
          observation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encaissements_loyers_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      factures_conseil: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          date_echeance: string
          date_emission: string
          id: string
          mois_concerne: string
          montant_ht: number
          montant_ttc: number
          notes: string | null
          reference: string
          statut: Database["public"]["Enums"]["statut_facture"]
          tva: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          date_echeance: string
          date_emission: string
          id?: string
          mois_concerne: string
          montant_ht: number
          montant_ttc: number
          notes?: string | null
          reference: string
          statut?: Database["public"]["Enums"]["statut_facture"]
          tva?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          date_echeance?: string
          date_emission?: string
          id?: string
          mois_concerne?: string
          montant_ht?: number
          montant_ttc?: number
          notes?: string | null
          reference?: string
          statut?: Database["public"]["Enums"]["statut_facture"]
          tva?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "factures_conseil_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_conseil"
            referencedColumns: ["id"]
          },
        ]
      }
      honoraires_contentieux: {
        Row: {
          affaire_id: string
          created_at: string
          created_by: string
          date_facturation: string | null
          id: string
          montant_encaisse: number
          montant_facture: number
          notes: string | null
        }
        Insert: {
          affaire_id: string
          created_at?: string
          created_by: string
          date_facturation?: string | null
          id?: string
          montant_encaisse?: number
          montant_facture?: number
          notes?: string | null
        }
        Update: {
          affaire_id?: string
          created_at?: string
          created_by?: string
          date_facturation?: string | null
          id?: string
          montant_encaisse?: number
          montant_facture?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "honoraires_contentieux_affaire_id_fkey"
            columns: ["affaire_id"]
            isOneToOne: false
            referencedRelation: "affaires"
            referencedColumns: ["id"]
          },
        ]
      }
      honoraires_recouvrement: {
        Row: {
          created_at: string
          created_by: string
          dossier_id: string
          id: string
          montant_paye: number
          montant_prevu: number
          pourcentage: number | null
          type: Database["public"]["Enums"]["type_honoraires"]
        }
        Insert: {
          created_at?: string
          created_by: string
          dossier_id: string
          id?: string
          montant_paye?: number
          montant_prevu?: number
          pourcentage?: number | null
          type?: Database["public"]["Enums"]["type_honoraires"]
        }
        Update: {
          created_at?: string
          created_by?: string
          dossier_id?: string
          id?: string
          montant_paye?: number
          montant_prevu?: number
          pourcentage?: number | null
          type?: Database["public"]["Enums"]["type_honoraires"]
        }
        Relationships: [
          {
            foreignKeyName: "honoraires_recouvrement_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers_recouvrement"
            referencedColumns: ["id"]
          },
        ]
      }
      immeubles: {
        Row: {
          adresse: string
          created_at: string
          created_by: string | null
          id: string
          nom: string
          notes: string | null
          proprietaire_id: string
          reference: string
          taux_commission_capco: number
        }
        Insert: {
          adresse: string
          created_at?: string
          created_by?: string | null
          id?: string
          nom: string
          notes?: string | null
          proprietaire_id: string
          reference: string
          taux_commission_capco?: number
        }
        Update: {
          adresse?: string
          created_at?: string
          created_by?: string | null
          id?: string
          nom?: string
          notes?: string | null
          proprietaire_id?: string
          reference?: string
          taux_commission_capco?: number
        }
        Relationships: [
          {
            foreignKeyName: "immeubles_proprietaire_id_fkey"
            columns: ["proprietaire_id"]
            isOneToOne: false
            referencedRelation: "proprietaires"
            referencedColumns: ["id"]
          },
        ]
      }
      locataires: {
        Row: {
          adresse: string | null
          contrat_url: string | null
          created_at: string
          created_by: string | null
          date_naissance: string | null
          documents: Json | null
          email: string | null
          id: string
          lieu_travail: string | null
          nationalite: string | null
          nom: string
          notes: string | null
          numero_piece_identite: string | null
          personne_contact_urgence: string | null
          piece_identite_url: string | null
          profession: string | null
          situation_familiale: string | null
          telephone: string | null
          telephone_urgence: string | null
          type_piece_identite: string | null
        }
        Insert: {
          adresse?: string | null
          contrat_url?: string | null
          created_at?: string
          created_by?: string | null
          date_naissance?: string | null
          documents?: Json | null
          email?: string | null
          id?: string
          lieu_travail?: string | null
          nationalite?: string | null
          nom: string
          notes?: string | null
          numero_piece_identite?: string | null
          personne_contact_urgence?: string | null
          piece_identite_url?: string | null
          profession?: string | null
          situation_familiale?: string | null
          telephone?: string | null
          telephone_urgence?: string | null
          type_piece_identite?: string | null
        }
        Update: {
          adresse?: string | null
          contrat_url?: string | null
          created_at?: string
          created_by?: string | null
          date_naissance?: string | null
          documents?: Json | null
          email?: string | null
          id?: string
          lieu_travail?: string | null
          nationalite?: string | null
          nom?: string
          notes?: string | null
          numero_piece_identite?: string | null
          personne_contact_urgence?: string | null
          piece_identite_url?: string | null
          profession?: string | null
          situation_familiale?: string | null
          telephone?: string | null
          telephone_urgence?: string | null
          type_piece_identite?: string | null
        }
        Relationships: []
      }
      locataires_dossiers_recouvrement: {
        Row: {
          created_at: string
          created_by: string | null
          dossier_id: string
          id: string
          locataire_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dossier_id: string
          id?: string
          locataire_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dossier_id?: string
          id?: string
          locataire_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locataires_dossiers_recouvrement_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers_recouvrement"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locataires_dossiers_recouvrement_locataire_id_fkey"
            columns: ["locataire_id"]
            isOneToOne: false
            referencedRelation: "locataires"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          created_at: string
          created_by: string | null
          etage: string | null
          id: string
          immeuble_id: string
          locataire_id: string | null
          loyer_mensuel_attendu: number
          numero: string
          statut: Database["public"]["Enums"]["statut_lot"]
          type: Database["public"]["Enums"]["type_lot"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          etage?: string | null
          id?: string
          immeuble_id: string
          locataire_id?: string | null
          loyer_mensuel_attendu?: number
          numero: string
          statut?: Database["public"]["Enums"]["statut_lot"]
          type?: Database["public"]["Enums"]["type_lot"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          etage?: string | null
          id?: string
          immeuble_id?: string
          locataire_id?: string | null
          loyer_mensuel_attendu?: number
          numero?: string
          statut?: Database["public"]["Enums"]["statut_lot"]
          type?: Database["public"]["Enums"]["type_lot"]
        }
        Relationships: [
          {
            foreignKeyName: "lots_immeuble_id_fkey"
            columns: ["immeuble_id"]
            isOneToOne: false
            referencedRelation: "immeubles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_locataire_id_fkey"
            columns: ["locataire_id"]
            isOneToOne: false
            referencedRelation: "locataires"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_conseil: {
        Row: {
          commentaire: string | null
          created_at: string
          created_by: string
          date: string
          facture_id: string
          id: string
          mode: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          reference: string | null
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          created_by: string
          date: string
          facture_id: string
          id?: string
          mode: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          reference?: string | null
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          created_by?: string
          date?: string
          facture_id?: string
          id?: string
          mode?: Database["public"]["Enums"]["mode_paiement"]
          montant?: number
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_conseil_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures_conseil"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_honoraires_contentieux: {
        Row: {
          created_at: string
          created_by: string
          date: string
          honoraires_id: string
          id: string
          mode_paiement: string
          montant: number
          notes: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          date?: string
          honoraires_id: string
          id?: string
          mode_paiement: string
          montant?: number
          notes?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          honoraires_id?: string
          id?: string
          mode_paiement?: string
          montant?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_honoraires_contentieux_honoraires_id_fkey"
            columns: ["honoraires_id"]
            isOneToOne: false
            referencedRelation: "honoraires_contentieux"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_recouvrement: {
        Row: {
          commentaire: string | null
          created_at: string
          created_by: string
          date: string
          dossier_id: string
          id: string
          mode: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          reference: string | null
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          created_by: string
          date: string
          dossier_id: string
          id?: string
          mode: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          reference?: string | null
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          created_by?: string
          date?: string
          dossier_id?: string
          id?: string
          mode?: Database["public"]["Enums"]["mode_paiement"]
          montant?: number
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_recouvrement_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers_recouvrement"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          adresse: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          nom: string
          telephone: string | null
          type: Database["public"]["Enums"]["type_partie"]
          type_relation: Database["public"]["Enums"]["type_relation"]
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          nom: string
          telephone?: string | null
          type?: Database["public"]["Enums"]["type_partie"]
          type_relation: Database["public"]["Enums"]["type_relation"]
        }
        Update: {
          adresse?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          nom?: string
          telephone?: string | null
          type?: Database["public"]["Enums"]["type_partie"]
          type_relation?: Database["public"]["Enums"]["type_relation"]
        }
        Relationships: []
      }
      proprietaires: {
        Row: {
          adresse: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          nom: string
          telephone: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          nom: string
          telephone?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          nom?: string
          telephone?: string | null
        }
        Relationships: []
      }
      rapports_gestion: {
        Row: {
          date_generation: string
          generer_par: string
          id: string
          immeuble_id: string
          net_proprietaire: number
          periode_debut: string
          periode_fin: string
          statut: string
          total_commissions: number
          total_depenses: number
          total_loyers: number
        }
        Insert: {
          date_generation?: string
          generer_par: string
          id?: string
          immeuble_id: string
          net_proprietaire?: number
          periode_debut: string
          periode_fin: string
          statut?: string
          total_commissions?: number
          total_depenses?: number
          total_loyers?: number
        }
        Update: {
          date_generation?: string
          generer_par?: string
          id?: string
          immeuble_id?: string
          net_proprietaire?: number
          periode_debut?: string
          periode_fin?: string
          statut?: string
          total_commissions?: number
          total_depenses?: number
          total_loyers?: number
        }
        Relationships: [
          {
            foreignKeyName: "rapports_gestion_immeuble_id_fkey"
            columns: ["immeuble_id"]
            isOneToOne: false
            referencedRelation: "immeubles"
            referencedColumns: ["id"]
          },
        ]
      }
      resultats_audiences: {
        Row: {
          audience_id: string
          created_at: string
          created_by: string
          id: string
          motif_radiation: string | null
          motif_renvoi: string | null
          nouvelle_date: string | null
          texte_delibere: string | null
          type: Database["public"]["Enums"]["type_resultat"]
        }
        Insert: {
          audience_id: string
          created_at?: string
          created_by: string
          id?: string
          motif_radiation?: string | null
          motif_renvoi?: string | null
          nouvelle_date?: string | null
          texte_delibere?: string | null
          type: Database["public"]["Enums"]["type_resultat"]
        }
        Update: {
          audience_id?: string
          created_at?: string
          created_by?: string
          id?: string
          motif_radiation?: string | null
          motif_renvoi?: string | null
          nouvelle_date?: string | null
          texte_delibere?: string | null
          type?: Database["public"]["Enums"]["type_resultat"]
        }
        Relationships: [
          {
            foreignKeyName: "resultats_audiences_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: true
            referencedRelation: "audiences"
            referencedColumns: ["id"]
          },
        ]
      }
      taches_conseil: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          date: string
          description: string
          duree_minutes: number | null
          id: string
          mois_concerne: string
          type: Database["public"]["Enums"]["type_tache"]
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          date: string
          description: string
          duree_minutes?: number | null
          id?: string
          mois_concerne: string
          type?: Database["public"]["Enums"]["type_tache"]
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          duree_minutes?: number | null
          id?: string
          mois_concerne?: string
          type?: Database["public"]["Enums"]["type_tache"]
        }
        Relationships: [
          {
            foreignKeyName: "taches_conseil_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_conseil"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_affaire_reference: { Args: never; Returns: string }
      generate_client_reference: { Args: never; Returns: string }
      generate_dossier_reference: { Args: never; Returns: string }
      generate_facture_reference: { Args: never; Returns: string }
      generate_immeuble_reference: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_action: {
        Args: {
          _action: string
          _details?: Json
          _entity_id?: string
          _entity_reference?: string
          _entity_type: string
          _module: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "collaborateur" | "compta"
      mode_paiement: "CASH" | "VIREMENT" | "CHEQUE" | "WAVE" | "OM"
      objet_audience: "MISE_EN_ETAT" | "PLAIDOIRIE" | "REFERE" | "AUTRE"
      priorite_alerte: "HAUTE" | "MOYENNE" | "BASSE"
      statut_affaire: "ACTIVE" | "CLOTUREE" | "RADIEE"
      statut_audience: "A_VENIR" | "PASSEE_NON_RENSEIGNEE" | "RENSEIGNEE"
      statut_bail: "ACTIF" | "INACTIF"
      statut_client_conseil: "ACTIF" | "SUSPENDU" | "RESILIE"
      statut_facture:
        | "BROUILLON"
        | "ENVOYEE"
        | "PAYEE"
        | "EN_RETARD"
        | "ANNULEE"
      statut_lot: "LIBRE" | "OCCUPE"
      statut_recouvrement: "EN_COURS" | "CLOTURE"
      type_action:
        | "APPEL_TELEPHONIQUE"
        | "COURRIER"
        | "LETTRE_RELANCE"
        | "MISE_EN_DEMEURE"
        | "COMMANDEMENT_PAYER"
        | "ASSIGNATION"
        | "REQUETE"
        | "AUDIENCE_PROCEDURE"
        | "AUTRE"
      type_alerte:
        | "AUDIENCE_NON_RENSEIGNEE"
        | "DOSSIER_SANS_ACTION"
        | "LOYER_IMPAYE"
        | "ECHEANCE_PROCHE"
        | "FACTURE_IMPAYEE"
      type_depense_dossier:
        | "FRAIS_HUISSIER"
        | "FRAIS_GREFFE"
        | "TIMBRES_FISCAUX"
        | "FRAIS_COURRIER"
        | "FRAIS_DEPLACEMENT"
        | "FRAIS_EXPERTISE"
        | "AUTRES"
      type_depense_immeuble:
        | "PLOMBERIE_ASSAINISSEMENT"
        | "ELECTRICITE_ECLAIRAGE"
        | "ENTRETIEN_MAINTENANCE"
        | "SECURITE_GARDIENNAGE_ASSURANCE"
        | "AUTRES_DEPENSES"
      type_honoraires: "FORFAIT" | "POURCENTAGE" | "MIXTE"
      type_lot:
        | "STUDIO"
        | "F1"
        | "F2"
        | "F3"
        | "F4"
        | "F5"
        | "MAGASIN"
        | "BUREAU"
        | "AUTRE"
      type_partie: "physique" | "morale"
      type_relation:
        | "creancier"
        | "debiteur"
        | "proprietaire"
        | "locataire"
        | "adversaire"
        | "demandeur"
        | "defendeur"
      type_resultat: "RENVOI" | "RADIATION" | "DELIBERE"
      type_tache:
        | "CONSULTATION"
        | "REDACTION"
        | "NEGOCIATION"
        | "RECHERCHE"
        | "REUNION"
        | "APPEL"
        | "EMAIL"
        | "AUTRE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "collaborateur", "compta"],
      mode_paiement: ["CASH", "VIREMENT", "CHEQUE", "WAVE", "OM"],
      objet_audience: ["MISE_EN_ETAT", "PLAIDOIRIE", "REFERE", "AUTRE"],
      priorite_alerte: ["HAUTE", "MOYENNE", "BASSE"],
      statut_affaire: ["ACTIVE", "CLOTUREE", "RADIEE"],
      statut_audience: ["A_VENIR", "PASSEE_NON_RENSEIGNEE", "RENSEIGNEE"],
      statut_bail: ["ACTIF", "INACTIF"],
      statut_client_conseil: ["ACTIF", "SUSPENDU", "RESILIE"],
      statut_facture: ["BROUILLON", "ENVOYEE", "PAYEE", "EN_RETARD", "ANNULEE"],
      statut_lot: ["LIBRE", "OCCUPE"],
      statut_recouvrement: ["EN_COURS", "CLOTURE"],
      type_action: [
        "APPEL_TELEPHONIQUE",
        "COURRIER",
        "LETTRE_RELANCE",
        "MISE_EN_DEMEURE",
        "COMMANDEMENT_PAYER",
        "ASSIGNATION",
        "REQUETE",
        "AUDIENCE_PROCEDURE",
        "AUTRE",
      ],
      type_alerte: [
        "AUDIENCE_NON_RENSEIGNEE",
        "DOSSIER_SANS_ACTION",
        "LOYER_IMPAYE",
        "ECHEANCE_PROCHE",
        "FACTURE_IMPAYEE",
      ],
      type_depense_dossier: [
        "FRAIS_HUISSIER",
        "FRAIS_GREFFE",
        "TIMBRES_FISCAUX",
        "FRAIS_COURRIER",
        "FRAIS_DEPLACEMENT",
        "FRAIS_EXPERTISE",
        "AUTRES",
      ],
      type_depense_immeuble: [
        "PLOMBERIE_ASSAINISSEMENT",
        "ELECTRICITE_ECLAIRAGE",
        "ENTRETIEN_MAINTENANCE",
        "SECURITE_GARDIENNAGE_ASSURANCE",
        "AUTRES_DEPENSES",
      ],
      type_honoraires: ["FORFAIT", "POURCENTAGE", "MIXTE"],
      type_lot: [
        "STUDIO",
        "F1",
        "F2",
        "F3",
        "F4",
        "F5",
        "MAGASIN",
        "BUREAU",
        "AUTRE",
      ],
      type_partie: ["physique", "morale"],
      type_relation: [
        "creancier",
        "debiteur",
        "proprietaire",
        "locataire",
        "adversaire",
        "demandeur",
        "defendeur",
      ],
      type_resultat: ["RENVOI", "RADIATION", "DELIBERE"],
      type_tache: [
        "CONSULTATION",
        "REDACTION",
        "NEGOCIATION",
        "RECHERCHE",
        "REUNION",
        "APPEL",
        "EMAIL",
        "AUTRE",
      ],
    },
  },
} as const
