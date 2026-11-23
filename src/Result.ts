export enum Result {
  kotivoitto = "K",
  kotivoittoJatkoajalla = "KJ",
  kotivoittoRankkareilla = "RLK",
  vierasvoitto = "V",
  vierasvoittoJatkoajalla = "VJ",
  vierasvoittoRankkareilla = "RLV",
}

export const homeWinResults: Result[] =[
  Result.kotivoitto,
  Result.kotivoittoJatkoajalla,
  Result.kotivoittoRankkareilla,
]

export const awayWinResults: Result[] =[
  Result.vierasvoitto,
  Result.vierasvoittoJatkoajalla,
  Result.vierasvoittoRankkareilla,
]