import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    name: 'Teclado mecánico RGB 75%',
    description:
      'Teclado mecánico compacto con switches rojos, retroiluminación RGB y conexión USB-C desmontable.',
    priceInCents: 32900000,
    imageUrl: 'https://picsum.photos/seed/keyboard/600/600',
    quantity: 12,
  },
  {
    name: 'Mouse inalámbrico ergonómico',
    description:
      'Sensor de 16000 DPI, seis botones programables y hasta 70 horas de autonomía por carga.',
    priceInCents: 18500000,
    imageUrl: 'https://picsum.photos/seed/mouse/600/600',
    quantity: 25,
  },
  {
    name: 'Audífonos con cancelación de ruido',
    description:
      'Over-ear con cancelación activa híbrida, Bluetooth 5.3 y estuche rígido de transporte.',
    priceInCents: 45900000,
    imageUrl: 'https://picsum.photos/seed/headphones/600/600',
    quantity: 8,
  },
  {
    name: 'Monitor 27" QHD 165Hz',
    description:
      'Panel IPS de 2560x1440, 1ms de respuesta, altura ajustable y soporte VESA 100x100.',
    priceInCents: 129900000,
    imageUrl: 'https://picsum.photos/seed/monitor/600/600',
    quantity: 4,
  },
];

async function main() {
  for (const { quantity, ...product } of products) {
    const created = await prisma.product.upsert({
      where: { name: product.name },
      update: { ...product },
      create: {
        ...product,
        stock: { create: { quantity } },
      },
    });

    console.log(`✅ Producto listo: ${created.name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
