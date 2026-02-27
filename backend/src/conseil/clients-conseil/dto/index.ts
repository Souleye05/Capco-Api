// Re-export des DTOs principaux
export { CreateClientConseilDto } from './create-client-conseil.dto';
export { UpdateClientConseilDto } from './update-client-conseil.dto';
export { ClientConseilResponseDto } from './client-conseil-response.dto';
export { ClientsConseilQueryDto } from './clients-conseil-query.dto';

// Re-export des enums Prisma pour faciliter l'utilisation
export { StatutClientConseil, TypePartie } from '@prisma/client';