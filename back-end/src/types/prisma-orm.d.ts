declare module '@prisma/orm-postgres/runtime' {
  const postgres: <T = any>(options: { contractJson: any; url: string }) => any;
  export default postgres;
}

declare module '@prisma/orm-postgres/target/codecs' {
  export const pgNumericColumn: any;
}
