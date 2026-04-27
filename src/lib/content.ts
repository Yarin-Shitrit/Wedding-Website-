import { prisma } from "./prisma";

export function getMoments() {
  return prisma.moment.findMany({ orderBy: { order: "asc" } });
}

export function getGalleryItems() {
  return prisma.galleryItem.findMany({ orderBy: { order: "asc" } });
}

export function getScheduleItems() {
  return prisma.scheduleItem.findMany({ orderBy: { order: "asc" } });
}

export function getFaqItems() {
  return prisma.faqItem.findMany({ orderBy: { order: "asc" } });
}
