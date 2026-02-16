import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProprietaireRow {
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
}

interface LocataireRow {
  nom: string;
  telephone?: string;
  email?: string;
}

interface ImmeubleRow {
  nom: string;
  adresse: string;
  proprietaire_nom: string;
  taux_commission: string;
  notes?: string;
}

interface LotRow {
  numero: string;
  immeuble_nom: string;
  type: string;
  etage?: string;
  loyer_mensuel: string;
  locataire_nom?: string;
  statut: string;
}

const parseNumber = (value: string | number | undefined): number => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  // Remove "CFA", spaces, dashes, and parse
  const cleaned = value.toString().replace(/[^0-9.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const parseCommission = (value: string | number | undefined): number => {
  if (value === undefined || value === null || value === '') return 5;
  if (typeof value === 'number') return value;
  const cleaned = value.toString().replace('%', '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 5 : num;
};

const normalizeType = (type: string): string => {
  const upperType = type?.toUpperCase()?.trim() || 'AUTRE';
  const validTypes = ['STUDIO', 'F1', 'F2', 'F3', 'F4', 'F5', 'MAGASIN', 'BUREAU', 'AUTRE'];
  return validTypes.includes(upperType) ? upperType : 'AUTRE';
};

const normalizeStatut = (statut: string): 'LIBRE' | 'OCCUPE' => {
  const upperStatut = statut?.toUpperCase()?.trim() || 'LIBRE';
  return upperStatut === 'OCCUPE' ? 'OCCUPE' : 'LIBRE';
};

export const importExcelData = async (file: File): Promise<{ success: boolean; message: string }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get sheet names
    const sheetNames = workbook.SheetNames;
    console.log('Sheets found:', sheetNames);
    
    // Find sheets by name (case-insensitive, partial match)
    const findSheet = (keywords: string[]) => {
      return sheetNames.find(name => 
        keywords.some(keyword => name.toLowerCase().includes(keyword.toLowerCase()))
      );
    };
    
    const proprietairesSheetName = findSheet(['propriétaire', 'proprietaire', 'proprio']);
    const locatairesSheetName = findSheet(['locataire']);
    const immeublesSheetName = findSheet(['immeuble']);
    const lotsSheetName = findSheet(['lot']);
    
    console.log('Mapped sheets:', { proprietairesSheetName, locatairesSheetName, immeublesSheetName, lotsSheetName });
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Vous devez être connecté pour importer des données');
    }
    
    const createdProprietaires: Map<string, string> = new Map();
    const createdLocataires: Map<string, string> = new Map();
    const createdImmeubles: Map<string, string> = new Map();
    
    // 1. Import Propriétaires
    if (proprietairesSheetName) {
      const sheet = workbook.Sheets[proprietairesSheetName];
      const data = XLSX.utils.sheet_to_json<ProprietaireRow>(sheet);
      console.log('Propriétaires data:', data);
      
      for (const row of data) {
        if (!row.nom || row.nom.includes('(exemple)')) continue;
        
        const nom = row.nom.trim();
        if (createdProprietaires.has(nom)) continue;
        
        const { data: existing } = await supabase
          .from('proprietaires')
          .select('id')
          .eq('nom', nom)
          .maybeSingle();
          
        if (existing) {
          createdProprietaires.set(nom, existing.id);
          continue;
        }
        
        const { data: created, error } = await supabase
          .from('proprietaires')
          .insert({
            nom,
            telephone: row.telephone?.toString() || null,
            email: row.email || null,
            adresse: row.adresse || null,
            created_by: user.id
          })
          .select('id')
          .single();
          
        if (error) {
          console.error('Error creating proprietaire:', error);
          continue;
        }
        
        createdProprietaires.set(nom, created.id);
      }
      
      toast.success(`${createdProprietaires.size} propriétaires importés`);
    }
    
    // 2. Import Locataires
    if (locatairesSheetName) {
      const sheet = workbook.Sheets[locatairesSheetName];
      const data = XLSX.utils.sheet_to_json<LocataireRow>(sheet);
      console.log('Locataires data:', data);
      
      for (const row of data) {
        if (!row.nom || row.nom.includes('(exemple)') || row.nom.trim() === '') continue;
        
        const nom = row.nom.trim();
        if (createdLocataires.has(nom)) continue;
        
        const { data: existing } = await supabase
          .from('locataires')
          .select('id')
          .eq('nom', nom)
          .maybeSingle();
          
        if (existing) {
          createdLocataires.set(nom, existing.id);
          continue;
        }
        
        const { data: created, error } = await supabase
          .from('locataires')
          .insert({
            nom,
            telephone: row.telephone?.toString() || null,
            email: row.email || null,
            created_by: user.id
          })
          .select('id')
          .single();
          
        if (error) {
          console.error('Error creating locataire:', error);
          continue;
        }
        
        createdLocataires.set(nom, created.id);
      }
      
      toast.success(`${createdLocataires.size} locataires importés`);
    }
    
    // 3. Import Immeubles
    if (immeublesSheetName) {
      const sheet = workbook.Sheets[immeublesSheetName];
      const data = XLSX.utils.sheet_to_json<ImmeubleRow>(sheet);
      console.log('Immeubles data:', data);
      
      for (const row of data) {
        if (!row.nom || row.nom.includes('(exemple)')) continue;
        
        const nom = row.nom.trim();
        if (createdImmeubles.has(nom)) continue;
        
        const proprietaireNom = row.proprietaire_nom?.trim();
        let proprietaireId = createdProprietaires.get(proprietaireNom || '');
        
        // If proprietaire not found, try to find or create
        if (!proprietaireId && proprietaireNom) {
          const { data: existing } = await supabase
            .from('proprietaires')
            .select('id')
            .eq('nom', proprietaireNom)
            .maybeSingle();
            
          if (existing) {
            proprietaireId = existing.id;
          } else {
            const { data: created } = await supabase
              .from('proprietaires')
              .insert({ nom: proprietaireNom, created_by: user.id })
              .select('id')
              .single();
            if (created) {
              proprietaireId = created.id;
              createdProprietaires.set(proprietaireNom, created.id);
            }
          }
        }
        
        if (!proprietaireId) {
          console.error(`Propriétaire non trouvé pour immeuble: ${nom}`);
          continue;
        }
        
        const { data: existingImmeuble } = await supabase
          .from('immeubles')
          .select('id')
          .eq('nom', nom)
          .maybeSingle();
          
        if (existingImmeuble) {
          createdImmeubles.set(nom, existingImmeuble.id);
          continue;
        }
        
        // Generate reference using database function
        const { data: refData } = await supabase.rpc('generate_immeuble_reference');
        const reference = refData || `IMM-${Date.now()}`;
        
        const { data: created, error } = await supabase
          .from('immeubles')
          .insert({
            nom,
            adresse: row.adresse || nom,
            proprietaire_id: proprietaireId,
            taux_commission_capco: parseCommission(row.taux_commission),
            notes: row.notes || null,
            reference,
            created_by: user.id
          })
          .select('id')
          .single();
          
        if (error) {
          console.error('Error creating immeuble:', error);
          continue;
        }
        
        createdImmeubles.set(nom, created.id);
      }
      
      toast.success(`${createdImmeubles.size} immeubles importés`);
    }
    
    // 4. Import Lots
    if (lotsSheetName) {
      const sheet = workbook.Sheets[lotsSheetName];
      const data = XLSX.utils.sheet_to_json<LotRow>(sheet);
      console.log('Lots data:', data);
      
      let lotsCreated = 0;
      
      for (const row of data) {
        if (!row.numero || row.numero.includes('(exemple)') || row.numero.trim() === '') continue;
        // Skip info rows
        if (row.numero.toLowerCase().includes('types autorisés') || 
            row.numero.toLowerCase().includes('statuts autorisés')) continue;
        
        const immeubleNom = row.immeuble_nom?.trim();
        let immeubleId = createdImmeubles.get(immeubleNom || '');
        
        // If immeuble not found, try to find in database
        if (!immeubleId && immeubleNom) {
          const { data: existing } = await supabase
            .from('immeubles')
            .select('id')
            .eq('nom', immeubleNom)
            .maybeSingle();
            
          if (existing) {
            immeubleId = existing.id;
            createdImmeubles.set(immeubleNom, existing.id);
          }
        }
        
        if (!immeubleId) {
          console.error(`Immeuble non trouvé pour lot: ${row.numero} - ${immeubleNom}`);
          continue;
        }
        
        const locataireNom = row.locataire_nom?.trim();
        let locataireId: string | null = null;
        
        if (locataireNom && locataireNom !== '') {
          locataireId = createdLocataires.get(locataireNom) || null;
          
          if (!locataireId) {
            const { data: existing } = await supabase
              .from('locataires')
              .select('id')
              .eq('nom', locataireNom)
              .maybeSingle();
              
            if (existing) {
              locataireId = existing.id;
            } else {
              const { data: created } = await supabase
                .from('locataires')
                .insert({ nom: locataireNom, created_by: user.id })
                .select('id')
                .single();
              if (created) {
                locataireId = created.id;
                createdLocataires.set(locataireNom, created.id);
              }
            }
          }
        }
        
        // Check if lot already exists
        const { data: existingLot } = await supabase
          .from('lots')
          .select('id')
          .eq('numero', row.numero.trim())
          .eq('immeuble_id', immeubleId)
          .maybeSingle();
          
        if (existingLot) continue;
        
        const lotData = {
          numero: row.numero.trim(),
          immeuble_id: immeubleId,
          type: normalizeType(row.type) as 'STUDIO' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'MAGASIN' | 'BUREAU' | 'AUTRE',
          etage: row.etage || null,
          loyer_mensuel_attendu: parseNumber(row.loyer_mensuel),
          locataire_id: locataireId,
          statut: normalizeStatut(row.statut),
          created_by: user.id
        };
        
        const { error } = await supabase
          .from('lots')
          .insert(lotData);
          
        if (error) {
          console.error('Error creating lot:', error);
          continue;
        }
        
        lotsCreated++;
      }
      
      toast.success(`${lotsCreated} lots importés`);
    }
    
    return { 
      success: true, 
      message: `Import terminé: ${createdProprietaires.size} propriétaires, ${createdLocataires.size} locataires, ${createdImmeubles.size} immeubles` 
    };
    
  } catch (error) {
    console.error('Import error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'import';
    toast.error(message);
    return { success: false, message };
  }
};
