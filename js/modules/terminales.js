// GFVMCR — Terminales TPV

// TPV DATA + RENDER FUNCTIONS
// ═══════════════════════════════════════
const TPV_DG_CLIENTS  = [{"id": 12, "cliente": "C Cumbres", "monto_tc": 4874020.5, "monto_td": 9152306.850000001, "monto_amex": 32501, "total": 14058828.350000001}, {"id": 84, "cliente": "La Churrasca Atlixco", "monto_tc": 1010453.8799999997, "monto_td": 1060268.0799999998, "monto_amex": 201614.42, "total": 2272336.3799999994}, {"id": 137, "cliente": "Del Valle", "monto_tc": 471802, "monto_td": 811338, "monto_amex": 118705, "total": 1401845}, {"id": 83, "cliente": "La Cantada", "monto_tc": 597765.2000000001, "monto_td": 672681.44, "monto_amex": 51877.75, "total": 1322324.3900000001}, {"id": 147, "cliente": "Lucia Acapulco", "monto_tc": 450227.16, "monto_td": 582211.7599999999, "monto_amex": 18540, "total": 1050978.92}, {"id": 123, "cliente": "TONYS RESTAURANTE", "monto_tc": 582443.75, "monto_td": 377478.45, "monto_amex": 17080.25, "total": 977002.45}, {"id": 142, "cliente": "Flamingos Palace", "monto_tc": 250476, "monto_td": 657897, "monto_amex": 0, "total": 908373}, {"id": 14, "cliente": "Carlevaro Muebleria", "monto_tc": 411595.3900000001, "monto_td": 368325, "monto_amex": 40275, "total": 820195.3900000001}, {"id": 98, "cliente": "Norday Termos", "monto_tc": 246581.55, "monto_td": 268187.41000000003, "monto_amex": 38430, "total": 553198.96}, {"id": 40, "cliente": "ECYQ Medical Benefits", "monto_tc": 543863, "monto_td": 0, "monto_amex": 0, "total": 543863}, {"id": 111, "cliente": "RAMIREZ Y RAMIREZ", "monto_tc": 343400, "monto_td": 65760, "monto_amex": 43000, "total": 452160}, {"id": 91, "cliente": "Mato Grosso", "monto_tc": 196635.79999999996, "monto_td": 212147.61, "monto_amex": 3479.16, "total": 412262.5699999999}, {"id": 143, "cliente": "Focaccia", "monto_tc": 144735, "monto_td": 249445.5, "monto_amex": 10515, "total": 404695.5}, {"id": 125, "cliente": "Topolino", "monto_tc": 153994.2, "monto_td": 206972.9100000002, "monto_amex": 5498.45, "total": 366465.56000000023}, {"id": 124, "cliente": "Top Tent Outlet", "monto_tc": 233576.59999999998, "monto_td": 118492.3, "monto_amex": 0, "total": 352068.89999999997}, {"id": 128, "cliente": "UrbanOutled", "monto_tc": 138966.3, "monto_td": 205108.23, "monto_amex": 1, "total": 344075.53}, {"id": 86, "cliente": "LA CUPULA", "monto_tc": 141115.5, "monto_td": 164113.1, "monto_amex": 5305.5, "total": 310534.1}, {"id": 72, "cliente": "HE", "monto_tc": 134002.70000000004, "monto_td": 152670.43000000005, "monto_amex": 6540.099999999999, "total": 293213.2300000001}, {"id": 5, "cliente": "AMOBA", "monto_tc": 136180.55, "monto_td": 141729.85, "monto_amex": 2184.5, "total": 280094.9}, {"id": 85, "cliente": "La Crianza", "monto_tc": 152491.02, "monto_td": 122156.44, "monto_amex": 2873.05, "total": 277520.50999999995}, {"id": 55, "cliente": "Empire Fitness Lomas de Angelopolis", "monto_tc": 147098, "monto_td": 126297, "monto_amex": 0, "total": 273395}, {"id": 120, "cliente": "Tintoreria Easy Clean", "monto_tc": 144910, "monto_td": 111470, "monto_amex": 10838, "total": 267218}, {"id": 45, "cliente": "Empire Fitness Cholula", "monto_tc": 118263, "monto_td": 130934, "monto_amex": 0, "total": 249197}, {"id": 61, "cliente": "Empire Fitness Torres Medicas", "monto_tc": 106598, "monto_td": 141096, "monto_amex": 0, "total": 247694}, {"id": 95, "cliente": "Molienda Sagrada", "monto_tc": 121126.01000000002, "monto_td": 111792.81999999996, "monto_amex": 7427.100000000001, "total": 240345.93}, {"id": 48, "cliente": "Empire Fitness Estambres", "monto_tc": 110620, "monto_td": 115210, "monto_amex": 1912, "total": 227742}, {"id": 139, "cliente": "Dentista Ninos", "monto_tc": 135120, "monto_td": 90240, "monto_amex": 1350, "total": 226710}, {"id": 24, "cliente": "CONSULTORIO MEDICO DR DAVID FIGUEROA", "monto_tc": 119500, "monto_td": 77000, "monto_amex": 22400, "total": 218900}, {"id": 35, "cliente": "DR JUAN DE DIOS QUIROZ", "monto_tc": 94316, "monto_td": 90685, "monto_amex": 27260, "total": 212261}, {"id": 20, "cliente": "Club PH Phonique", "monto_tc": 108529.2, "monto_td": 69829.76000000001, "monto_amex": 28832.649999999998, "total": 207191.61000000002}, {"id": 27, "cliente": "Dabuten", "monto_tc": 100033.34999999999, "monto_td": 90989.12999999999, "monto_amex": 15589.33, "total": 206611.80999999997}, {"id": 117, "cliente": "Siembra Comedor", "monto_tc": 120252.85, "monto_td": 85568.6, "monto_amex": 0, "total": 205821.45}, {"id": 69, "cliente": "Funky Mama", "monto_tc": 84768.25, "monto_td": 103582.69999999998, "monto_amex": 7274.5, "total": 195625.44999999998}, {"id": 60, "cliente": "Empire Fitness Tlaxcala", "monto_tc": 60223, "monto_td": 116209, "monto_amex": 0, "total": 176432}, {"id": 78, "cliente": "HU", "monto_tc": 83530.44999999998, "monto_td": 85165.66999999997, "monto_amex": 5177.049999999999, "total": 173873.16999999993}, {"id": 53, "cliente": "Empire Fitness Heroes", "monto_tc": 78233, "monto_td": 90784, "monto_amex": 3668, "total": 172685}, {"id": 46, "cliente": "Empire Fitness Cienega", "monto_tc": 49272, "monto_td": 115202, "monto_amex": 0, "total": 164474}, {"id": 70, "cliente": "Grupo Vitalis", "monto_tc": 84590, "monto_td": 66625.04000000001, "monto_amex": 11210, "total": 162425.04}, {"id": 41, "cliente": "Eleven People", "monto_tc": 46959.5, "monto_td": 28263.3, "monto_amex": 83136, "total": 158358.8}, {"id": 89, "cliente": "Luna Canela", "monto_tc": 55760.94, "monto_td": 67674.29000000001, "monto_amex": 27509, "total": 150944.23}, {"id": 42, "cliente": "Empire Fitness 31 PTE", "monto_tc": 75623, "monto_td": 67704, "monto_amex": 479, "total": 143806}, {"id": 54, "cliente": "Empire Fitness Las Torres", "monto_tc": 57183, "monto_td": 81868.9, "monto_amex": 0, "total": 139051.9}, {"id": 62, "cliente": "Empire Fitness Vive la Cienega", "monto_tc": 54110, "monto_td": 84886, "monto_amex": 0, "total": 138996}, {"id": 100, "cliente": "NUTRIMET CUAUTLANCINGO", "monto_tc": 40752.2, "monto_td": 89823, "monto_amex": 0, "total": 130575.2}, {"id": 36, "cliente": "Dr Juan Domingo Porras", "monto_tc": 61400, "monto_td": 55500, "monto_amex": 13500, "total": 130400}, {"id": 19, "cliente": "Clinica Dental Sonrie", "monto_tc": 68075, "monto_td": 60625, "monto_amex": 0, "total": 128700}, {"id": 126, "cliente": "Trinidad Designer", "monto_tc": 41800, "monto_td": 86595, "monto_amex": 0, "total": 128395}, {"id": 59, "cliente": "Empire Fitness Tlahuac", "monto_tc": 70432, "monto_td": 56291, "monto_amex": 0, "total": 126723}, {"id": 49, "cliente": "Empire Fitness Finsa", "monto_tc": 48457, "monto_td": 73949, "monto_amex": 0, "total": 122406}, {"id": 8, "cliente": "Bar 7", "monto_tc": 56900, "monto_td": 13000, "monto_amex": 49500, "total": 119400}, {"id": 51, "cliente": "Empire Fitness Galerias Serdan CH", "monto_tc": 37155, "monto_td": 77304, "monto_amex": 0, "total": 114459}, {"id": 93, "cliente": "Mexico Handmade", "monto_tc": 109635, "monto_td": 0, "monto_amex": 4536, "total": 114171}, {"id": 76, "cliente": "HP", "monto_tc": 43527, "monto_td": 66259, "monto_amex": 0, "total": 109786}, {"id": 7, "cliente": "Arko Payment Solutions", "monto_tc": 54401.5, "monto_td": 50745.15, "monto_amex": 4078.25, "total": 109224.9}, {"id": 22, "cliente": "Constructora Brumo", "monto_tc": 105316, "monto_td": 0, "monto_amex": 1100, "total": 106416}, {"id": 121, "cliente": "Todo Corazon", "monto_tc": 40608.5, "monto_td": 25236, "monto_amex": 36505, "total": 102349.5}, {"id": 13, "cliente": "CACHITO LINDO Y QUERIDO", "monto_tc": 38640.5, "monto_td": 54723.85, "monto_amex": 0, "total": 93364.35}, {"id": 113, "cliente": "Rodane", "monto_tc": 40585.25, "monto_td": 50135.130000000005, "monto_amex": 0, "total": 90720.38}, {"id": 71, "cliente": "Hacienda Soleil", "monto_tc": 51819.74999999999, "monto_td": 32909.799999999996, "monto_amex": 5930.24, "total": 90659.79}, {"id": 148, "cliente": "Mayan Art", "monto_tc": 0, "monto_td": 0, "monto_amex": 88771, "total": 88771}, {"id": 44, "cliente": "Empire Fitness Centro Historico", "monto_tc": 40587, "monto_td": 47964, "monto_amex": 0, "total": 88551}, {"id": 37, "cliente": "DR RODRIGO MONROY CARVAJAL", "monto_tc": 53100, "monto_td": 35200, "monto_amex": 0, "total": 88300}, {"id": 2, "cliente": "ADICTO CAFE LA MINERVA", "monto_tc": 34888.79, "monto_td": 52268.00999999998, "monto_amex": 640, "total": 87796.79999999999}, {"id": 34, "cliente": "DR JORGE GARCIA RENTERIA", "monto_tc": 27194, "monto_td": 60597, "monto_amex": 0, "total": 87791}, {"id": 116, "cliente": "Servicios Medicos Integrales", "monto_tc": 70885.98, "monto_td": 15160.240000000002, "monto_amex": 0, "total": 86046.22}, {"id": 52, "cliente": "Empire Fitness Guadalajara", "monto_tc": 60127, "monto_td": 21097, "monto_amex": 4484, "total": 85708}, {"id": 56, "cliente": "Empire Fitness Mirador 1", "monto_tc": 38688, "monto_td": 46101, "monto_amex": 479, "total": 85268}, {"id": 74, "cliente": "Hostess 4G", "monto_tc": 85000, "monto_td": 0, "monto_amex": 0, "total": 85000}, {"id": 97, "cliente": "MT Mechanics", "monto_tc": 49810.020000000004, "monto_td": 25759, "monto_amex": 0, "total": 75569.02}, {"id": 118, "cliente": "Super el Valle", "monto_tc": 12916, "monto_td": 61379, "monto_amex": 0, "total": 74295}, {"id": 127, "cliente": "UNIDAD DE ESPECIALIDADES ORTOPEDICAS", "monto_tc": 24200, "monto_td": 46400, "monto_amex": 2500, "total": 73100}, {"id": 26, "cliente": "CR Alimentos", "monto_tc": 23246.75, "monto_td": 44286.75, "monto_amex": 3680, "total": 71213.5}, {"id": 135, "cliente": "Yacht Cancun", "monto_tc": 0, "monto_td": 3.0299999999999994, "monto_amex": 71150.1, "total": 71153.13}, {"id": 57, "cliente": "Empire Fitness Mirador 2", "monto_tc": 41328, "monto_td": 29356, "monto_amex": 0, "total": 70684}, {"id": 145, "cliente": "Focca 2", "monto_tc": 29610.610000000008, "monto_td": 31546.500000000004, "monto_amex": 3477.6, "total": 64634.710000000014}, {"id": 119, "cliente": "Templados Varsa", "monto_tc": 7826.900000000001, "monto_td": 54423.52, "monto_amex": 0, "total": 62250.42}, {"id": 87, "cliente": "La ruta de las Indias", "monto_tc": 17155, "monto_td": 42310, "monto_amex": 1800, "total": 61265}, {"id": 15, "cliente": "Casa Mexicana", "monto_tc": 14010, "monto_td": 1.01, "monto_amex": 46075, "total": 60086.01}, {"id": 141, "cliente": "Ecoden", "monto_tc": 14000, "monto_td": 43200, "monto_amex": 0, "total": 57200}, {"id": 50, "cliente": "Empire Fitness Fortuna", "monto_tc": 27470, "monto_td": 29667, "monto_amex": 0, "total": 57137}, {"id": 47, "cliente": "Empire Fitness Ecatepec", "monto_tc": 20979, "monto_td": 35501, "monto_amex": 50, "total": 56530}, {"id": 11, "cliente": "Box Box Car Service", "monto_tc": 45108.42, "monto_td": 7719.01, "monto_amex": 2250, "total": 55077.43}, {"id": 31, "cliente": "DR FRANCISCO JAVIER ", "monto_tc": 28110, "monto_td": 26255, "monto_amex": 0, "total": 54365}, {"id": 101, "cliente": "NUTRISIM", "monto_tc": 26179.33, "monto_td": 25634, "monto_amex": 921, "total": 52734.33}, {"id": 23, "cliente": "Consulta Medica DU", "monto_tc": 30200, "monto_td": 20701, "monto_amex": 1200, "total": 52101}, {"id": 104, "cliente": "Padel World", "monto_tc": 19100, "monto_td": 16085, "monto_amex": 12360, "total": 47545}, {"id": 159, "cliente": "TGRS", "monto_tc": 18748.829999999998, "monto_td": 26618.059999999994, "monto_amex": 1575.6, "total": 46942.48999999999}, {"id": 79, "cliente": "INSTITUTO PANAMERICANO DEL CORAZON", "monto_tc": 14600, "monto_td": 28300, "monto_amex": 0, "total": 42900}, {"id": 68, "cliente": "Freshify", "monto_tc": 13639.609999999999, "monto_td": 15458.97, "monto_amex": 10919.57, "total": 40018.149999999994}, {"id": 30, "cliente": "DR FERNANDO ZARAIN", "monto_tc": 14600, "monto_td": 22500, "monto_amex": 1000, "total": 38100}, {"id": 43, "cliente": "Empire Fitness Acocota", "monto_tc": 22360, "monto_td": 11429, "monto_amex": 0, "total": 33789}, {"id": 136, "cliente": "Convenia Links de Pago", "monto_tc": 33000, "monto_td": 0, "monto_amex": 0, "total": 33000}, {"id": 94, "cliente": "MJ", "monto_tc": 12250, "monto_td": 19910.01, "monto_amex": 0, "total": 32160.01}, {"id": 32, "cliente": "DR GERARDO CASTORENA ROJI", "monto_tc": 18000, "monto_td": 14000, "monto_amex": 0, "total": 32000}, {"id": 110, "cliente": "Quesos Chiapas 2", "monto_tc": 11983, "monto_td": 12707.9, "monto_amex": 5299.51, "total": 29990.410000000003}, {"id": 133, "cliente": "Why Wait", "monto_tc": 7800, "monto_td": 5000, "monto_amex": 16360, "total": 29160}, {"id": 77, "cliente": "HS", "monto_tc": 11185, "monto_td": 17553, "monto_amex": 0, "total": 28738}, {"id": 115, "cliente": "Santuario Pio", "monto_tc": 12380, "monto_td": 15020, "monto_amex": 0, "total": 27400}, {"id": 38, "cliente": "DUMEDIC", "monto_tc": 4487, "monto_td": 0, "monto_amex": 21841, "total": 26328}, {"id": 58, "cliente": "Empire Fitness San Martin", "monto_tc": 8328, "monto_td": 16423, "monto_amex": 0, "total": 24751}, {"id": 63, "cliente": "Fededome", "monto_tc": 11984, "monto_td": 10484, "monto_amex": 0, "total": 22468}, {"id": 96, "cliente": "Montajes Operativos", "monto_tc": 2844, "monto_td": 18416.22, "monto_amex": 0, "total": 21260.22}, {"id": 132, "cliente": "Wallfine", "monto_tc": 19188.15, "monto_td": 155, "monto_amex": 0, "total": 19343.15}, {"id": 29, "cliente": "DR FELIX URBINA", "monto_tc": 8900, "monto_td": 9400, "monto_amex": 0, "total": 18300}, {"id": 151, "cliente": "Camca Automotriz", "monto_tc": 17400, "monto_td": 0, "monto_amex": 0, "total": 17400}, {"id": 146, "cliente": "Iglesia Cristiana", "monto_tc": 2975, "monto_td": 9030, "monto_amex": 0, "total": 12005}, {"id": 33, "cliente": "DR JESUS PONCE ONCOPEDIA", "monto_tc": 2500, "monto_td": 8800, "monto_amex": 0, "total": 11300}, {"id": 109, "cliente": "Quesos Chiapas", "monto_tc": 1190, "monto_td": 8472, "monto_amex": 0, "total": 9662}, {"id": 80, "cliente": "Joyeria Zafiro", "monto_tc": 0, "monto_td": 0, "monto_amex": 8675, "total": 8675}, {"id": 90, "cliente": "Manik Odontologia", "monto_tc": 4900, "monto_td": 3650, "monto_amex": 5, "total": 8555}, {"id": 66, "cliente": "Frans Automotive", "monto_tc": 2000, "monto_td": 6510, "monto_amex": 0, "total": 8510}, {"id": 129, "cliente": "UROLOGIA FUNCIONAL", "monto_tc": 4500, "monto_td": 3600, "monto_amex": 0, "total": 8100}, {"id": 6, "cliente": "Antojo Gula", "monto_tc": 3746.5, "monto_td": 3876.8, "monto_amex": 350, "total": 7973.3}, {"id": 3, "cliente": "Ajedrez", "monto_tc": 3590, "monto_td": 3590, "monto_amex": 0, "total": 7180}, {"id": 108, "cliente": "Potato Shop", "monto_tc": 7000, "monto_td": 0, "monto_amex": 0, "total": 7000}, {"id": 138, "cliente": "Dentalyss Center", "monto_tc": 6500, "monto_td": 0, "monto_amex": 0, "total": 6500}, {"id": 106, "cliente": "Playa Kaleta Restaurante", "monto_tc": 678.5, "monto_td": 5762.200000000001, "monto_amex": 0, "total": 6440.700000000001}, {"id": 149, "cliente": "Nutriment 11 Sur", "monto_tc": 4815, "monto_td": 1399, "monto_amex": 0, "total": 6214}, {"id": 156, "cliente": "Los Amigos", "monto_tc": 2212.1300000000006, "monto_td": 3997.8, "monto_amex": 0, "total": 6209.93}, {"id": 9, "cliente": "Bar La Oficina", "monto_tc": 485, "monto_td": 4456, "monto_amex": 759, "total": 5700}, {"id": 140, "cliente": "Dr Rogelio Herrera Lima", "monto_tc": 0, "monto_td": 5000, "monto_amex": 0, "total": 5000}, {"id": 103, "cliente": "OTORRINO LOMAS", "monto_tc": 4930, "monto_td": 0, "monto_amex": 0, "total": 4930}, {"id": 10, "cliente": "Blackhawk", "monto_tc": 2430, "monto_td": 1610, "monto_amex": 580, "total": 4620}, {"id": 154, "cliente": "HD", "monto_tc": 1940.02, "monto_td": 2060.04, "monto_amex": 0, "total": 4000.06}, {"id": 75, "cliente": "Hotel Casa Real", "monto_tc": 625, "monto_td": 3345, "monto_amex": 0, "total": 3970}, {"id": 155, "cliente": "La Ruta De Las Indias SF", "monto_tc": 0, "monto_td": 1850, "monto_amex": 0, "total": 1850}, {"id": 102, "cliente": "Onoloa Poke House", "monto_tc": 1608, "monto_td": 236.5, "monto_amex": 0, "total": 1844.5}, {"id": 152, "cliente": "Corte Gaucho", "monto_tc": 1840, "monto_td": 0, "monto_amex": 0, "total": 1840}, {"id": 105, "cliente": "PadelMatch", "monto_tc": 1225, "monto_td": 55, "monto_amex": 0, "total": 1280}, {"id": 158, "cliente": "RAWPAW", "monto_tc": 856, "monto_td": 0, "monto_amex": 0, "total": 856}, {"id": 67, "cliente": "Fresh Solutions", "monto_tc": 0, "monto_td": 500, "monto_amex": 0, "total": 500}, {"id": 21, "cliente": "Cocina Montejo", "monto_tc": 250, "monto_td": 202, "monto_amex": 0, "total": 452}, {"id": 82, "cliente": "LA CALLE", "monto_tc": 0, "monto_td": 0, "monto_amex": 280, "total": 280}, {"id": 64, "cliente": "Ferba Sports", "monto_tc": 0, "monto_td": 50, "monto_amex": 0, "total": 50}, {"id": 1, "cliente": "7 Cielos", "monto_tc": 10, "monto_td": 20, "monto_amex": 0, "total": 30}, {"id": 130, "cliente": "Viajes CEUNI", "monto_tc": 11, "monto_td": 0, "monto_amex": 10, "total": 21}, {"id": 112, "cliente": "Rest B", "monto_tc": 10, "monto_td": 0, "monto_amex": 10, "total": 20}, {"id": 4, "cliente": "Amo Tulum Tours", "monto_tc": 0, "monto_td": 11, "monto_amex": 0, "total": 11}, {"id": 17, "cliente": "CENTUM CABO", "monto_tc": 11, "monto_td": 0, "monto_amex": 0, "total": 11}, {"id": 157, "cliente": "Obsidiana", "monto_tc": 10, "monto_td": 0, "monto_amex": 0, "total": 10}, {"id": 18, "cliente": "CENTUM CAPITAL", "monto_tc": 3.1, "monto_td": 0, "monto_amex": 0, "total": 3.1}, {"id": 122, "cliente": "Tony2", "monto_tc": 0, "monto_td": 0.01, "monto_amex": 1.1, "total": 1.11}, {"id": 107, "cliente": "Poch del Huach Centro", "monto_tc": 0, "monto_td": 1, "monto_amex": 0, "total": 1}, {"id": 114, "cliente": "Santo Chancho", "monto_tc": 1, "monto_td": 0, "monto_amex": 0, "total": 1}, {"id": 134, "cliente": "Wicho", "monto_tc": 1, "monto_td": 0, "monto_amex": 0, "total": 1}, {"id": 144, "cliente": "Focca", "monto_tc": 1, "monto_td": 0, "monto_amex": 0, "total": 1}, {"id": 81, "cliente": "Jpart", "monto_tc": 0.02, "monto_td": 0, "monto_amex": 0, "total": 0.02}, {"id": 16, "cliente": "Centro Joyero Centenario", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 25, "cliente": "Convenia Link de Pago", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 28, "cliente": "Dentista de Niños", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 39, "cliente": "ECODEM", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 65, "cliente": "Foccacia", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 73, "cliente": "HLT Services", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 88, "cliente": "Lucia Aca", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 92, "cliente": "Mayan Arts", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 99, "cliente": "Nutrimet 11 Sur", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 131, "cliente": "VIP del Valle", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 150, "cliente": "Arq Alejandro Jimenez", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 153, "cliente": "DupratDr", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}];
const TPV_D_CLIENTS   = [{"id": 12, "cliente": "C CUMBRES", "monto_tc": 2733836.6500000004, "monto_td": 5552448.75, "monto_amex": 27060, "total": 8313345.4}, {"id": 84, "cliente": "La Churrasca Atlixco", "monto_tc": 976008.3799999998, "monto_td": 1019637.8799999998, "monto_amex": 176869.42, "total": 2172515.6799999997}, {"id": 138, "cliente": "Del Valle", "monto_tc": 471802, "monto_td": 811338, "monto_amex": 118705, "total": 1401845}, {"id": 148, "cliente": "Lucia Acapulco", "monto_tc": 389990.16, "monto_td": 474569.7599999999, "monto_amex": 6540, "total": 871099.9199999999}, {"id": 83, "cliente": "LA CANTADA", "monto_tc": 370000.9, "monto_td": 413161.9100000001, "monto_amex": 38426.25, "total": 821589.06}, {"id": 14, "cliente": "Carlevaro Muebleria", "monto_tc": 399195.38000000006, "monto_td": 216275, "monto_amex": 40275, "total": 655745.3800000001}, {"id": 123, "cliente": "Tonys Restaurante", "monto_tc": 365640.5, "monto_td": 226805.2, "monto_amex": 15269, "total": 607714.7}, {"id": 40, "cliente": "ECyQ Medical Benefits", "monto_tc": 543863, "monto_td": 0, "monto_amex": 0, "total": 543863}, {"id": 91, "cliente": "Mato Grosso", "monto_tc": 196635.79999999996, "monto_td": 212147.61, "monto_amex": 3479.16, "total": 412262.5699999999}, {"id": 144, "cliente": "Focaccia", "monto_tc": 144735, "monto_td": 249445.5, "monto_amex": 10515, "total": 404695.5}, {"id": 98, "cliente": "NORDAY Termos", "monto_tc": 151136.05, "monto_td": 156583.8, "monto_amex": 26720, "total": 334439.85}, {"id": 128, "cliente": "UrbanOutled", "monto_tc": 116658.3, "monto_td": 155727.93000000002, "monto_amex": 1, "total": 272387.23000000004}, {"id": 55, "cliente": "Empire Fitness Lomas de Angelopolis", "monto_tc": 140844, "monto_td": 120929, "monto_amex": 0, "total": 261773}, {"id": 111, "cliente": "RAMIREZ Y RAMIREZ", "monto_tc": 188600, "monto_td": 46500, "monto_amex": 20000, "total": 255100}, {"id": 86, "cliente": "LA CUPULA", "monto_tc": 112145.25, "monto_td": 135070.1, "monto_amex": 4523.5, "total": 251738.85}, {"id": 124, "cliente": "TOP TENT OUTLET", "monto_tc": 144764.59999999998, "monto_td": 95790, "monto_amex": 0, "total": 240554.59999999998}, {"id": 45, "cliente": "Empire Fitness Cholula", "monto_tc": 112863, "monto_td": 116308, "monto_amex": 0, "total": 229171}, {"id": 61, "cliente": "Empire Fitness Torres Medicas", "monto_tc": 91608, "monto_td": 130317, "monto_amex": 0, "total": 221925}, {"id": 48, "cliente": "Empire Fitness Estambres", "monto_tc": 102788, "monto_td": 108838, "monto_amex": 1912, "total": 213538}, {"id": 20, "cliente": "Club PH Phonique", "monto_tc": 108529.2, "monto_td": 69829.76000000001, "monto_amex": 28832.649999999998, "total": 207191.61000000002}, {"id": 85, "cliente": "LA CRIANZA", "monto_tc": 114883.85, "monto_td": 85392.7, "monto_amex": 1749, "total": 202025.55}, {"id": 120, "cliente": "Tintoreria Easy Clean", "monto_tc": 108247, "monto_td": 79228, "monto_amex": 8512, "total": 195987}, {"id": 5, "cliente": "AMOBA", "monto_tc": 94987.8, "monto_td": 93420.5, "monto_amex": 10, "total": 188418.3}, {"id": 72, "cliente": "HE", "monto_tc": 75961.54000000001, "monto_td": 97979.06, "monto_amex": 5121.9, "total": 179062.5}, {"id": 117, "cliente": "SIEMBRA COMEDOR", "monto_tc": 98913.35, "monto_td": 76266.6, "monto_amex": 0, "total": 175179.95}, {"id": 95, "cliente": "MOLIENDA SAGRADA", "monto_tc": 87287.32000000002, "monto_td": 80457.02, "monto_amex": 3586.65, "total": 171330.99000000002}, {"id": 53, "cliente": "Empire Fitness Heroes", "monto_tc": 70783, "monto_td": 88181, "monto_amex": 3668, "total": 162632}, {"id": 125, "cliente": "Topolino", "monto_tc": 69370, "monto_td": 90373.06000000001, "monto_amex": 0, "total": 159743.06}, {"id": 140, "cliente": "Dentista Ninos", "monto_tc": 98240, "monto_td": 56970, "monto_amex": 1350, "total": 156560}, {"id": 60, "cliente": "Empire Fitness Tlaxcala", "monto_tc": 45061, "monto_td": 106929, "monto_amex": 0, "total": 151990}, {"id": 35, "cliente": "DR JUAN DE DIOS QUIROZ", "monto_tc": 71130, "monto_td": 58785, "monto_amex": 15215, "total": 145130}, {"id": 24, "cliente": "CONSULTORIO MEDICO DR DAVID FIGUEROA", "monto_tc": 70000, "monto_td": 62800, "monto_amex": 11900, "total": 144700}, {"id": 69, "cliente": "Funky Mama", "monto_tc": 64977.75, "monto_td": 72484.69999999998, "monto_amex": 3299, "total": 140761.44999999998}, {"id": 46, "cliente": "Empire Fitness Cienega", "monto_tc": 40590, "monto_td": 97556, "monto_amex": 0, "total": 138146}, {"id": 42, "cliente": "Empire Fitness 31 PTE", "monto_tc": 68788, "monto_td": 61489, "monto_amex": 479, "total": 130756}, {"id": 27, "cliente": "DABUTEN", "monto_tc": 61882.17999999999, "monto_td": 52152.73, "monto_amex": 8533.849999999999, "total": 122568.76000000001}, {"id": 54, "cliente": "Empire Fitness Las Torres", "monto_tc": 47506, "monto_td": 73437.9, "monto_amex": 0, "total": 120943.9}, {"id": 62, "cliente": "Empire Fitness Vive la Cienega", "monto_tc": 46339, "monto_td": 74399, "monto_amex": 0, "total": 120738}, {"id": 126, "cliente": "Trinidad Designer", "monto_tc": 32100, "monto_td": 86595, "monto_amex": 0, "total": 118695}, {"id": 70, "cliente": "GRUPO VITALIS", "monto_tc": 60980, "monto_td": 49465.04, "monto_amex": 5410, "total": 115855.04000000001}, {"id": 93, "cliente": "Mexico Handmade", "monto_tc": 109635, "monto_td": 0, "monto_amex": 490, "total": 110125}, {"id": 78, "cliente": "HU", "monto_tc": 57910.57, "monto_td": 50511.28999999999, "monto_amex": 991.31, "total": 109413.16999999998}, {"id": 51, "cliente": "Empire Fitness Galerias Serdan CH", "monto_tc": 31809, "monto_td": 73333, "monto_amex": 0, "total": 105142}, {"id": 59, "cliente": "Empire Fitness Tlahuac", "monto_tc": 53262, "monto_td": 51415, "monto_amex": 0, "total": 104677}, {"id": 121, "cliente": "Todo Corazon", "monto_tc": 40608.5, "monto_td": 25236, "monto_amex": 36505, "total": 102349.5}, {"id": 49, "cliente": "Empire Fitness Finsa", "monto_tc": 38077, "monto_td": 64057, "monto_amex": 0, "total": 102134}, {"id": 36, "cliente": "Dr Juan Domingo Porras", "monto_tc": 45300, "monto_td": 44100, "monto_amex": 10500, "total": 99900}, {"id": 100, "cliente": "NUTRIMET CUAUTLANCINGO", "monto_tc": 30671.199999999997, "monto_td": 68683, "monto_amex": 0, "total": 99354.2}, {"id": 13, "cliente": "CACHITO LINDO Y QUERIDO", "monto_tc": 38640.5, "monto_td": 54723.85, "monto_amex": 0, "total": 93364.35}, {"id": 89, "cliente": "Luna Canela", "monto_tc": 24540.94, "monto_td": 43846, "monto_amex": 22667.5, "total": 91054.44}, {"id": 149, "cliente": "Mayan Art", "monto_tc": 0, "monto_td": 0, "monto_amex": 88771, "total": 88771}, {"id": 2, "cliente": "ADICTO CAFE LA MINERVA", "monto_tc": 34888.79, "monto_td": 51963.00999999998, "monto_amex": 431, "total": 87282.79999999999}, {"id": 7, "cliente": "ARKO PAYMENT SOLUTIONS", "monto_tc": 44857.25, "monto_td": 38832.15, "monto_amex": 3333.25, "total": 87022.65}, {"id": 74, "cliente": "Hostess 4G", "monto_tc": 85000, "monto_td": 0, "monto_amex": 0, "total": 85000}, {"id": 44, "cliente": "Empire Fitness Centro Historico", "monto_tc": 36409, "monto_td": 40854, "monto_amex": 0, "total": 77263}, {"id": 116, "cliente": "Servicios Medicos Integrales", "monto_tc": 65127.159999999996, "monto_td": 11962.240000000002, "monto_amex": 0, "total": 77089.4}, {"id": 56, "cliente": "Empire Fitness Mirador 1", "monto_tc": 37567, "monto_td": 36760, "monto_amex": 479, "total": 74806}, {"id": 52, "cliente": "Empire Fitness Guadalajara", "monto_tc": 46567, "monto_td": 20928, "monto_amex": 4484, "total": 71979}, {"id": 57, "cliente": "Empire Fitness Mirador 2", "monto_tc": 37330, "monto_td": 28768, "monto_amex": 0, "total": 66098}, {"id": 37, "cliente": "DR RODRIGO MONROY CARVAJAL", "monto_tc": 44900, "monto_td": 20500, "monto_amex": 0, "total": 65400}, {"id": 22, "cliente": "Constructora Brumo", "monto_tc": 63666, "monto_td": 0, "monto_amex": 1100, "total": 64766}, {"id": 15, "cliente": "Casa Mexicana", "monto_tc": 14010, "monto_td": 0.01, "monto_amex": 46075, "total": 60085.01}, {"id": 19, "cliente": "Clinica Dental Sonrie", "monto_tc": 31375, "monto_td": 28275, "monto_amex": 0, "total": 59650}, {"id": 34, "cliente": "DR JORGE GARCIA RENTERIA", "monto_tc": 21228, "monto_td": 38382, "monto_amex": 0, "total": 59610}, {"id": 50, "cliente": "Empire Fitness Fortuna", "monto_tc": 27401, "monto_td": 29438, "monto_amex": 0, "total": 56839}, {"id": 118, "cliente": "Super el valle", "monto_tc": 10045, "monto_td": 46094.5, "monto_amex": 0, "total": 56139.5}, {"id": 135, "cliente": "Yacht Cancun", "monto_tc": 0, "monto_td": 3.0199999999999996, "monto_amex": 55400.1, "total": 55403.119999999995}, {"id": 11, "cliente": "Box Box Car Service", "monto_tc": 45108.42, "monto_td": 7719.01, "monto_amex": 2250, "total": 55077.43}, {"id": 31, "cliente": "DR FRANCISCO JAVIER ", "monto_tc": 28110, "monto_td": 26255, "monto_amex": 0, "total": 54365}, {"id": 47, "cliente": "Empire Fitness Ecatepec", "monto_tc": 20979, "monto_td": 32429, "monto_amex": 0, "total": 53408}, {"id": 76, "cliente": "HP", "monto_tc": 20395, "monto_td": 28377, "monto_amex": 0, "total": 48772}, {"id": 119, "cliente": "Templados Varsa", "monto_tc": 5099.91, "monto_td": 41311.57, "monto_amex": 0, "total": 46411.479999999996}, {"id": 87, "cliente": "La Ruta de las Indias", "monto_tc": 8595, "monto_td": 35730, "monto_amex": 1800, "total": 46125}, {"id": 41, "cliente": "Eleven People", "monto_tc": 40683, "monto_td": 3389, "monto_amex": 20, "total": 44092}, {"id": 79, "cliente": "INSTITUTO PANAMERICANO DEL CORAZON", "monto_tc": 14600, "monto_td": 28300, "monto_amex": 0, "total": 42900}, {"id": 26, "cliente": "CR Alimentos", "monto_tc": 14740.5, "monto_td": 24527.75, "monto_amex": 3074.5, "total": 42342.75}, {"id": 127, "cliente": "UNIDAD DE ESPECIALIDADES ORTOPEDICAS", "monto_tc": 4200, "monto_td": 36400, "monto_amex": 1500, "total": 42100}, {"id": 68, "cliente": "Freshify", "monto_tc": 11970.96, "monto_td": 12757.369999999999, "monto_amex": 10919.57, "total": 35647.899999999994}, {"id": 142, "cliente": "Ecoden", "monto_tc": 6800, "monto_td": 28100, "monto_amex": 0, "total": 34900}, {"id": 137, "cliente": "Convenia Links de Pago", "monto_tc": 33000, "monto_td": 0, "monto_amex": 0, "total": 33000}, {"id": 43, "cliente": "Empire Fitness Acocota", "monto_tc": 22291, "monto_td": 8181, "monto_amex": 0, "total": 30472}, {"id": 113, "cliente": "RODANE", "monto_tc": 17740.25, "monto_td": 11713.58, "monto_amex": 0, "total": 29453.83}, {"id": 104, "cliente": "PADEL WORLD", "monto_tc": 13855, "monto_td": 10405, "monto_amex": 3850, "total": 28110}, {"id": 30, "cliente": "DR FERNANDO ZARAIN", "monto_tc": 9100, "monto_td": 18000, "monto_amex": 0, "total": 27100}, {"id": 133, "cliente": "WHY WAIT", "monto_tc": 7800, "monto_td": 5000, "monto_amex": 13360, "total": 26160}, {"id": 110, "cliente": "Quesos Chiapas 2", "monto_tc": 10047, "monto_td": 10630.9, "monto_amex": 5299.51, "total": 25977.410000000003}, {"id": 77, "cliente": "HS", "monto_tc": 9748, "monto_td": 15103, "monto_amex": 0, "total": 24851}, {"id": 32, "cliente": "DR GERARDO CASTORENA ROJI", "monto_tc": 13000, "monto_td": 11000, "monto_amex": 0, "total": 24000}, {"id": 115, "cliente": "SANTUARIO PIO", "monto_tc": 8780, "monto_td": 12135, "monto_amex": 0, "total": 20915}, {"id": 63, "cliente": "FEDEDOME", "monto_tc": 11234, "monto_td": 8984, "monto_amex": 0, "total": 20218}, {"id": 132, "cliente": "Wallfine", "monto_tc": 18501.15, "monto_td": 0, "monto_amex": 0, "total": 18501.15}, {"id": 94, "cliente": "MJ", "monto_tc": 7720, "monto_td": 10525, "monto_amex": 0, "total": 18245}, {"id": 38, "cliente": "DUMEDIC", "monto_tc": 4487, "monto_td": 0, "monto_amex": 13165, "total": 17652}, {"id": 96, "cliente": "Montajes Operativos", "monto_tc": 1682, "monto_td": 12532, "monto_amex": 0, "total": 14214}, {"id": 29, "cliente": "DR FELIX URBINA", "monto_tc": 4100, "monto_td": 8200, "monto_amex": 0, "total": 12300}, {"id": 58, "cliente": "Empire Fitness San Martin", "monto_tc": 4330, "monto_td": 5930, "monto_amex": 0, "total": 10260}, {"id": 97, "cliente": "Mt Mechanics", "monto_tc": 9560.02, "monto_td": 0, "monto_amex": 0, "total": 9560.02}, {"id": 71, "cliente": "Hacienda Soleil", "monto_tc": 5834.9, "monto_td": 3050.95, "monto_amex": 0, "total": 8885.849999999999}, {"id": 33, "cliente": "DR JESUS PONCE ONCOPEDIA", "monto_tc": 1000, "monto_td": 7800, "monto_amex": 0, "total": 8800}, {"id": 66, "cliente": "Frans Automotive", "monto_tc": 2000, "monto_td": 6510, "monto_amex": 0, "total": 8510}, {"id": 129, "cliente": "UROLOGIA FUNCIONAL", "monto_tc": 4500, "monto_td": 3600, "monto_amex": 0, "total": 8100}, {"id": 3, "cliente": "AJEDREZ", "monto_tc": 3590, "monto_td": 3590, "monto_amex": 0, "total": 7180}, {"id": 108, "cliente": "Potato Shop", "monto_tc": 7000, "monto_td": 0, "monto_amex": 0, "total": 7000}, {"id": 106, "cliente": "Playa Kaleta Restaurante", "monto_tc": 678.5, "monto_td": 5762.200000000001, "monto_amex": 0, "total": 6440.700000000001}, {"id": 109, "cliente": "Quesos Chiapas", "monto_tc": 1190, "monto_td": 4830, "monto_amex": 0, "total": 6020}, {"id": 23, "cliente": "CONSULTA MEDICA DU", "monto_tc": 1200, "monto_td": 4600, "monto_amex": 0, "total": 5800}, {"id": 9, "cliente": "Bar La Oficina", "monto_tc": 485, "monto_td": 4456, "monto_amex": 759, "total": 5700}, {"id": 6, "cliente": "Antojo Gula", "monto_tc": 2894.4, "monto_td": 2520.3, "monto_amex": 0, "total": 5414.700000000001}, {"id": 90, "cliente": "Manik Odontologia", "monto_tc": 3800, "monto_td": 1550, "monto_amex": 0, "total": 5350}, {"id": 103, "cliente": "OTORRINO LOMAS", "monto_tc": 4930, "monto_td": 0, "monto_amex": 0, "total": 4930}, {"id": 101, "cliente": "NUTRISIM", "monto_tc": 4234.33, "monto_td": 532, "monto_amex": 0, "total": 4766.33}, {"id": 75, "cliente": "Hotel Casa Real", "monto_tc": 625, "monto_td": 3345, "monto_amex": 0, "total": 3970}, {"id": 10, "cliente": "BLACKHAWK", "monto_tc": 1400, "monto_td": 1030, "monto_amex": 580, "total": 3010}, {"id": 80, "cliente": "Joyeria Zafiro", "monto_tc": 0, "monto_td": 0, "monto_amex": 2204, "total": 2204}, {"id": 102, "cliente": "ONOLOA POKE HOUSE", "monto_tc": 1608, "monto_td": 236.5, "monto_amex": 0, "total": 1844.5}, {"id": 67, "cliente": "FRESH SOLUTIONS", "monto_tc": 0, "monto_td": 500, "monto_amex": 0, "total": 500}, {"id": 21, "cliente": "Cocina Montejo", "monto_tc": 250, "monto_td": 202, "monto_amex": 0, "total": 452}, {"id": 105, "cliente": "PadelMatch", "monto_tc": 25, "monto_td": 55, "monto_amex": 0, "total": 80}, {"id": 64, "cliente": "Ferba Sports", "monto_tc": 0, "monto_td": 50, "monto_amex": 0, "total": 50}, {"id": 1, "cliente": "7 Cielos", "monto_tc": 10, "monto_td": 20, "monto_amex": 0, "total": 30}, {"id": 130, "cliente": "Viajes CEUNI", "monto_tc": 11, "monto_td": 0, "monto_amex": 10, "total": 21}, {"id": 112, "cliente": "Rest B", "monto_tc": 10, "monto_td": 0, "monto_amex": 10, "total": 20}, {"id": 4, "cliente": "Amo Tulum Tours", "monto_tc": 0, "monto_td": 11, "monto_amex": 0, "total": 11}, {"id": 17, "cliente": "Centum Cabo", "monto_tc": 11, "monto_td": 0, "monto_amex": 0, "total": 11}, {"id": 18, "cliente": "Centum Capital", "monto_tc": 3.1, "monto_td": 0, "monto_amex": 0, "total": 3.1}, {"id": 122, "cliente": "Tony2", "monto_tc": 0, "monto_td": 0.01, "monto_amex": 1.1, "total": 1.11}, {"id": 107, "cliente": "Poch del Huach Centro", "monto_tc": 0, "monto_td": 1, "monto_amex": 0, "total": 1}, {"id": 114, "cliente": "SANTO CHANCHO", "monto_tc": 1, "monto_td": 0, "monto_amex": 0, "total": 1}, {"id": 134, "cliente": "WICHO", "monto_tc": 1, "monto_td": 0, "monto_amex": 0, "total": 1}, {"id": 145, "cliente": "Focca", "monto_tc": 1, "monto_td": 0, "monto_amex": 0, "total": 1}, {"id": 150, "cliente": "Nutriment 11 Sur", "monto_tc": 0, "monto_td": 1, "monto_amex": 0, "total": 1}, {"id": 81, "cliente": "Jpart", "monto_tc": 0.02, "monto_td": 0, "monto_amex": 0, "total": 0.02}, {"id": 8, "cliente": "BAR 7", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 16, "cliente": "Centro Joyero Centenario", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 25, "cliente": "CONVENIA LINKS DE PAGO", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 28, "cliente": "Dentista Ninos", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 39, "cliente": "ECODEN", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 65, "cliente": "FOCACCIA", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 73, "cliente": "HLT Services", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 82, "cliente": "La Calle", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 88, "cliente": "Lucia Acapulco", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 92, "cliente": "Mayan Art", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 99, "cliente": "Nutriment 11 sur", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 131, "cliente": "VIP del Valle", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 139, "cliente": "Dentalyss Center", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 141, "cliente": "Dr Rogelio Herrera Lima", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 143, "cliente": "Flamingos Palace", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 146, "cliente": "Focca 2", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 147, "cliente": "Iglesia Cristiana", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 151, "cliente": "Arq Alejandro Jimenez", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 152, "cliente": "Camca Automotriz", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 153, "cliente": "Corte Gaucho", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 154, "cliente": "DupratDr", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 155, "cliente": "HD", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 156, "cliente": "La Ruta De Las Indias SF", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 157, "cliente": "Los Amigos", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 158, "cliente": "Obsidiana", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 159, "cliente": "RAWPAW", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 160, "cliente": "TGRS", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}];
const TPV_PAGOS       = [{"id": 12, "cliente": "C CUMBRES", "monto_neto": 8087665.4241688, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 8087665.4241688}, {"id": 84, "cliente": "La Churrasca Atlixco", "monto_neto": 2206414.7115518, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 2206414.7115518}, {"id": 126, "cliente": "Trinidad Designer", "monto_neto": 845491.0811600001, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 845491.0811600001}, {"id": 83, "cliente": "LA CANTADA", "monto_neto": 783376.5708384, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 783376.5708384}, {"id": 123, "cliente": "Tonys Restaurante", "monto_neto": 711781.1729499999, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 711781.1729499999}, {"id": 14, "cliente": "Carlevaro Muebleria", "monto_neto": 635928.6017760001, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 635928.6017760001}, {"id": 40, "cliente": "ECyQ Medical Benefits", "monto_neto": 528090.973, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 528090.973}, {"id": 15, "cliente": "Casa Mexicana", "monto_neto": 475834.67902982666, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 475834.67902982666}, {"id": 91, "cliente": "Mato Grosso", "monto_neto": 401756.2263941999, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 401756.2263941999}, {"id": 98, "cliente": "NORDAY Termos", "monto_neto": 329287.61406199995, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 329287.61406199995}, {"id": 121, "cliente": "Todo Corazon", "monto_neto": 326318.5, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 326318.5}, {"id": 128, "cliente": "UrbanOutled", "monto_neto": 266938.85253760003, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 266938.85253760003}, {"id": 55, "cliente": "Empire Fitness Lomas de Angelopolis", "monto_neto": 260006.22736, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 260006.22736}, {"id": 86, "cliente": "LA CUPULA", "monto_neto": 259548.34386999998, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 259548.34386999998}, {"id": 111, "cliente": "RAMIREZ Y RAMIREZ", "monto_neto": 247516.5, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 247516.5}, {"id": 124, "cliente": "TOP TENT OUTLET", "monto_neto": 236718.2812832, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 236718.2812832}, {"id": 45, "cliente": "Empire Fitness Cholula", "monto_neto": 225094.6024, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 225094.6024}, {"id": 61, "cliente": "Empire Fitness Torres Medicas", "monto_neto": 221345.43388, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 221345.43388}, {"id": 48, "cliente": "Empire Fitness Estambres", "monto_neto": 208279.29084, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 208279.29084}, {"id": 20, "cliente": "Club PH Phonique", "monto_neto": 207191.61000000002, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 207191.61000000002}, {"id": 85, "cliente": "LA CRIANZA", "monto_neto": 201115.1547088, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 201115.1547088}, {"id": 5, "cliente": "AMOBA", "monto_neto": 192017.5863256, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 192017.5863256}, {"id": 120, "cliente": "Tintoreria Easy Clean", "monto_neto": 189475.87488, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 189475.87488}, {"id": 72, "cliente": "HE", "monto_neto": 178618.253908, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 178618.253908}, {"id": 117, "cliente": "SIEMBRA COMEDOR", "monto_neto": 177330.25659, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 177330.25659}, {"id": 95, "cliente": "MOLIENDA SAGRADA", "monto_neto": 169846.41399960002, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 169846.41399960002}, {"id": 53, "cliente": "Empire Fitness Heroes", "monto_neto": 158383.1468, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 158383.1468}, {"id": 125, "cliente": "Topolino", "monto_neto": 157227.54549599998, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 157227.54549599998}, {"id": 60, "cliente": "Empire Fitness Tlaxcala", "monto_neto": 148783.14384, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 148783.14384}, {"id": 24, "cliente": "CONSULTORIO MEDICO DR DAVID FIGUEROA", "monto_neto": 144721.008, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 144721.008}, {"id": 35, "cliente": "DR JUAN DE DIOS QUIROZ", "monto_neto": 143535.3626, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 143535.3626}, {"id": 69, "cliente": "Funky Mama", "monto_neto": 142873.794508, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 142873.794508}, {"id": 135, "cliente": "Yacht Cancun", "monto_neto": 138496.82754165333, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 138496.82754165333}, {"id": 46, "cliente": "Empire Fitness Cienega", "monto_neto": 134460.26472, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 134460.26472}, {"id": 42, "cliente": "Empire Fitness 31 PTE", "monto_neto": 128429.4016, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 128429.4016}, {"id": 78, "cliente": "HU", "monto_neto": 126163.16465919999, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 126163.16465919999}, {"id": 27, "cliente": "DABUTEN", "monto_neto": 120589.8845754, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 120589.8845754}, {"id": 54, "cliente": "Empire Fitness Las Torres", "monto_neto": 117755.58554799999, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 117755.58554799999}, {"id": 62, "cliente": "Empire Fitness Vive la Cienega", "monto_neto": 117583.06884, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 117583.06884}, {"id": 70, "cliente": "GRUPO VITALIS", "monto_neto": 112445.03904, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 112445.03904}, {"id": 93, "cliente": "Mexico Handmade", "monto_neto": 107359.22824, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 107359.22824}, {"id": 100, "cliente": "NUTRIMET CUAUTLANCINGO", "monto_neto": 105140.0262, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 105140.0262}, {"id": 59, "cliente": "Empire Fitness Tlahuac", "monto_neto": 103188.30996, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 103188.30996}, {"id": 51, "cliente": "Empire Fitness Galerias Serdan CH", "monto_neto": 102863.834, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 102863.834}, {"id": 36, "cliente": "Dr Juan Domingo Porras", "monto_neto": 100367.652, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 100367.652}, {"id": 49, "cliente": "Empire Fitness Finsa", "monto_neto": 100045.38144, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 100045.38144}, {"id": 80, "cliente": "Joyeria Zafiro", "monto_neto": 97357.80076, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 97357.80076}, {"id": 13, "cliente": "CACHITO LINDO Y QUERIDO", "monto_neto": 92217.17455000001, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 92217.17455000001}, {"id": 89, "cliente": "Luna Canela", "monto_neto": 88928.03498296, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 88928.03498296}, {"id": 38, "cliente": "DUMEDIC", "monto_neto": 88446.78864, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 88446.78864}, {"id": 2, "cliente": "ADICTO CAFE LA MINERVA", "monto_neto": 87511.34197, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 87511.34197}, {"id": 133, "cliente": "WHY WAIT", "monto_neto": 87165, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 87165}, {"id": 7, "cliente": "ARKO PAYMENT SOLUTIONS", "monto_neto": 85813.57406999999, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 85813.57406999999}, {"id": 52, "cliente": "Empire Fitness Guadalajara", "monto_neto": 84738.21284, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 84738.21284}, {"id": 74, "cliente": "Hostess 4G", "monto_neto": 82870.24, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 82870.24}, {"id": 44, "cliente": "Empire Fitness Centro Historico", "monto_neto": 76052.74536, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 76052.74536}, {"id": 116, "cliente": "Servicios Medicos Integrales", "monto_neto": 74544.6792784, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 74544.6792784}, {"id": 56, "cliente": "Empire Fitness Mirador 1", "monto_neto": 73279.7092, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 73279.7092}, {"id": 73, "cliente": "HLT Services", "monto_neto": 68283.08172, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 68283.08172}, {"id": 19, "cliente": "Clinica Dental Sonrie", "monto_neto": 64748.362, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 64748.362}, {"id": 57, "cliente": "Empire Fitness Mirador 2", "monto_neto": 64334.50536, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 64334.50536}, {"id": 37, "cliente": "DR RODRIGO MONROY CARVAJAL", "monto_neto": 63503.4, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 63503.4}, {"id": 22, "cliente": "Constructora Brumo", "monto_neto": 63128.676704, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 63128.676704}, {"id": 34, "cliente": "DR JORGE GARCIA RENTERIA", "monto_neto": 57881.31, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 57881.31}, {"id": 50, "cliente": "Empire Fitness Fortuna", "monto_neto": 55322.53548, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 55322.53548}, {"id": 11, "cliente": "Box Box Car Service", "monto_neto": 55077.43, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 55077.43}, {"id": 118, "cliente": "Super el valle", "monto_neto": 54689.3462, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 54689.3462}, {"id": 31, "cliente": "DR FRANCISCO JAVIER ", "monto_neto": 52788.415, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 52788.415}, {"id": 47, "cliente": "Empire Fitness Ecatepec", "monto_neto": 51983.07456, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 51983.07456}, {"id": 76, "cliente": "HP", "monto_neto": 47357.612, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 47357.612}, {"id": 87, "cliente": "La Ruta de las Indias", "monto_neto": 46533.70836, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 46533.70836}, {"id": 119, "cliente": "Templados Varsa", "monto_neto": 45312.25326072, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 45312.25326072}, {"id": 41, "cliente": "Eleven People", "monto_neto": 42620.44604, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 42620.44604}, {"id": 127, "cliente": "UNIDAD DE ESPECIALIDADES ORTOPEDICAS", "monto_neto": 42019.244, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 42019.244}, {"id": 79, "cliente": "INSTITUTO PANAMERICANO DEL CORAZON", "monto_neto": 41655.9, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 41655.9}, {"id": 26, "cliente": "CR Alimentos", "monto_neto": 41609.64778, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 41609.64778}, {"id": 68, "cliente": "Freshify", "monto_neto": 34570.147015999995, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 34570.147015999995}, {"id": 115, "cliente": "SANTUARIO PIO", "monto_neto": 33817.03418, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 33817.03418}, {"id": 43, "cliente": "Empire Fitness Acocota", "monto_neto": 29791.7244, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 29791.7244}, {"id": 30, "cliente": "DR FERNANDO ZARAIN", "monto_neto": 29199.26, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 29199.26}, {"id": 110, "cliente": "Quesos Chiapas 2", "monto_neto": 29117.410000000003, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 29117.410000000003}, {"id": 104, "cliente": "PADEL WORLD", "monto_neto": 28816.9008, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 28816.9008}, {"id": 113, "cliente": "RODANE", "monto_neto": 28599.66893, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 28599.66893}, {"id": 77, "cliente": "HS", "monto_neto": 25476.729, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 25476.729}, {"id": 32, "cliente": "DR GERARDO CASTORENA ROJI", "monto_neto": 24265.72, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 24265.72}, {"id": 63, "cliente": "FEDEDOME", "monto_neto": 19848.94784, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 19848.94784}, {"id": 132, "cliente": "Wallfine", "monto_neto": 17878.771314, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 17878.771314}, {"id": 94, "cliente": "MJ", "monto_neto": 17715.895, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 17715.895}, {"id": 21, "cliente": "Cocina Montejo", "monto_neto": 15385.811298666667, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 15385.811298666667}, {"id": 96, "cliente": "Montajes Operativos", "monto_neto": 13779.4524, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 13779.4524}, {"id": 29, "cliente": "DR FELIX URBINA", "monto_neto": 11943.3, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 11943.3}, {"id": 9, "cliente": "Bar La Oficina", "monto_neto": 11101, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 11101}, {"id": 66, "cliente": "Frans Automotive", "monto_neto": 10710, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 10710}, {"id": 58, "cliente": "Empire Fitness San Martin", "monto_neto": 9986.2632, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 9986.2632}, {"id": 97, "cliente": "Mt Mechanics", "monto_neto": 9338.227536, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 9338.227536}, {"id": 129, "cliente": "UROLOGIA FUNCIONAL", "monto_neto": 8730.648, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 8730.648}, {"id": 71, "cliente": "Hacienda Soleil", "monto_neto": 8628.160349999998, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 8628.160349999998}, {"id": 33, "cliente": "DR JESUS PONCE ONCOPEDIA", "monto_neto": 8544.8, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 8544.8}, {"id": 16, "cliente": "Centro Joyero Centenario", "monto_neto": 8333.66592, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 8333.66592}, {"id": 3, "cliente": "AJEDREZ", "monto_neto": 7038.4104, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 7038.4104}, {"id": 108, "cliente": "Potato Shop", "monto_neto": 6837.6, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 6837.6}, {"id": 106, "cliente": "Playa Kaleta Restaurante", "monto_neto": 6440.700000000001, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 6440.700000000001}, {"id": 90, "cliente": "Manik Odontologia", "monto_neto": 6081.558333333333, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 6081.558333333333}, {"id": 10, "cliente": "BLACKHAWK", "monto_neto": 5898.6661466666665, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 5898.6661466666665}, {"id": 109, "cliente": "Quesos Chiapas", "monto_neto": 5840.17448, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 5840.17448}, {"id": 23, "cliente": "CONSULTA MEDICA DU", "monto_neto": 5631.8, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 5631.8}, {"id": 6, "cliente": "Antojo Gula", "monto_neto": 5392.603016000001, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 5392.603016000001}, {"id": 8, "cliente": "BAR 7", "monto_neto": 4808.6, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 4808.6}, {"id": 103, "cliente": "OTORRINO LOMAS", "monto_neto": 4787.03, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 4787.03}, {"id": 101, "cliente": "NUTRISIM", "monto_neto": 4628.10643, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 4628.10643}, {"id": 75, "cliente": "Hotel Casa Real", "monto_neto": 3970, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 3970}, {"id": 102, "cliente": "ONOLOA POKE HOUSE", "monto_neto": 1783.41121, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 1783.41121}, {"id": 67, "cliente": "FRESH SOLUTIONS", "monto_neto": 487.49133333333333, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 487.49133333333333}, {"id": 105, "cliente": "PadelMatch", "monto_neto": 75.36, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 75.36}, {"id": 64, "cliente": "Ferba Sports", "monto_neto": 50, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 50}, {"id": 1, "cliente": "7 Cielos", "monto_neto": 29.0604, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 29.0604}, {"id": 130, "cliente": "Viajes CEUNI", "monto_neto": 20.2982, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 20.2982}, {"id": 112, "cliente": "Rest B", "monto_neto": 19.3272, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 19.3272}, {"id": 17, "cliente": "Centum Cabo", "monto_neto": 11, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 11}, {"id": 4, "cliente": "Amo Tulum Tours", "monto_neto": 10.66824, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 10.66824}, {"id": 18, "cliente": "Centum Capital", "monto_neto": 3.1, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 3.1}, {"id": 122, "cliente": "Tony2", "monto_neto": 1.0675962, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 1.0675962}, {"id": 107, "cliente": "Poch del Huach Centro", "monto_neto": 1, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 1}, {"id": 114, "cliente": "SANTO CHANCHO", "monto_neto": 0.974944, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0.974944}, {"id": 134, "cliente": "WICHO", "monto_neto": 0.96636, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0.96636}, {"id": 81, "cliente": "Jpart", "monto_neto": 0.0193272, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0.0193272}, {"id": 25, "cliente": "CONVENIA LINKS DE PAGO", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 28, "cliente": "Dentista Ninos", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 39, "cliente": "ECODEN", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 65, "cliente": "FOCACCIA", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 82, "cliente": "La Calle", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 88, "cliente": "Lucia Acapulco", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 92, "cliente": "Mayan Art", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 99, "cliente": "Nutriment 11 sur", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 131, "cliente": "VIP del Valle", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}];
const TPV_AGENTES     = [{"agente": "Angel Ahedo", "siglas": "AA", "pct": 0.1, "vendido": 19032351.9, "com_salem": 182908.00314611994, "com_agente": 18290.800314611995, "clientes": 174, "activos": 112, "pagado": 0, "pendiente": 18290.800314611995}, {"agente": "Javier Diez", "siglas": "JD", "pct": 0.1, "vendido": 2560591.4299999997, "com_salem": 0, "com_agente": 0, "clientes": 6, "activos": 0, "pagado": 0, "pendiente": 0}, {"agente": "Emiliano Mendoza", "siglas": "EM", "pct": 0.1, "vendido": 1083199.83, "com_salem": 7143.639808799998, "com_agente": 714.3639808799999, "clientes": 7, "activos": 5, "pagado": 0, "pendiente": 714.3639808799999}, {"agente": "Joaquin Vallejo", "siglas": "JV", "pct": 0.1, "vendido": 0, "com_salem": 0, "com_agente": 0, "clientes": 0, "activos": 0, "pagado": 0, "pendiente": 0}, {"agente": "Adrian Roman", "siglas": "AR", "pct": 0.1, "vendido": 16195961.3, "com_salem": 157841.13695400002, "com_agente": 15784.113695400003, "clientes": 6, "activos": 2, "pagado": 0, "pendiente": 15784.113695400003}, {"agente": "Monica Gonzalez", "siglas": "MG", "pct": 0.1, "vendido": 7000, "com_salem": 9.743999999999998, "com_agente": 0.9743999999999998, "clientes": 3, "activos": 1, "pagado": 0, "pendiente": 0.9743999999999998}, {"agente": "Jose de la Rosa", "siglas": "JR", "pct": 0.1, "vendido": 42792.41, "com_salem": 112.0792, "com_agente": 11.207920000000001, "clientes": 2, "activos": 2, "pagado": 0, "pendiente": 11.207920000000001}];
const TPV_TERMINALES  = [{"cliente": "La Churrasca Atlixco", "num_term": 3, "terminal_id": "01610015202405212245", "ultimo_uso": "2026-02-04", "ingresos": 1237393.6100000006, "transacciones": 389, "promedio": 3180.9604370179964, "dias_sin_uso": 19}, {"cliente": "Trinidad Designer", "num_term": 1, "terminal_id": "01610016202411271531", "ultimo_uso": "", "ingresos": 932161, "transacciones": 160, "promedio": 5826.00625, "dias_sin_uso": 4}, {"cliente": "Carlevaro Muebleria", "num_term": 2, "terminal_id": "01610060202309270202", "ultimo_uso": "2026-02-19", "ingresos": 669845, "transacciones": 27, "promedio": 24809.074074074073, "dias_sin_uso": 4}, {"cliente": "ECYQ Medical Benefits", "num_term": 1, "terminal_id": "01610060202309270969", "ultimo_uso": "2026-01-29", "ingresos": 543863, "transacciones": 16, "promedio": 33991.4375, "dias_sin_uso": 25}, {"cliente": "Mato Grosso", "num_term": 1, "terminal_id": "01610015202405211065", "ultimo_uso": "2026-02-04", "ingresos": 414900.4300000003, "transacciones": 318, "promedio": 1304.7183333333342, "dias_sin_uso": 19}, {"cliente": "Mayan Art", "num_term": 1, "terminal_id": "01610015202405211415", "ultimo_uso": "2026-02-15", "ingresos": 375563, "transacciones": 22, "promedio": 17071.045454545456, "dias_sin_uso": 8}, {"cliente": "NORDAY Termos", "num_term": 2, "terminal_id": "01610015202405211521", "ultimo_uso": "2026-02-23", "ingresos": 350409.35, "transacciones": 339, "promedio": 1033.6558997050147, "dias_sin_uso": 0}, {"cliente": "RAMIREZ Y RAMIREZ", "num_term": 1, "terminal_id": "01610060202309271354", "ultimo_uso": "2026-02-19", "ingresos": 342900, "transacciones": 14, "promedio": 24492.85714285714, "dias_sin_uso": 4}, {"cliente": "Todo Corazon", "num_term": 1, "terminal_id": "01610015202405211066", "ultimo_uso": "2026-02-05", "ingresos": 336938.5, "transacciones": 285, "promedio": 1182.240350877193, "dias_sin_uso": 18}, {"cliente": "Del Valle", "num_term": 4, "terminal_id": "01610080202310110215", "ultimo_uso": "2026-01-22", "ingresos": 304330, "transacciones": 260, "promedio": 1170.5, "dias_sin_uso": 32}, {"cliente": "LA CUPULA", "num_term": 1, "terminal_id": "01610060202309271370", "ultimo_uso": "2026-02-18", "ingresos": 304097.35, "transacciones": 272, "promedio": 1118.004963235294, "dias_sin_uso": 5}, {"cliente": "Empire Fitness Lomas de Angelopolis", "num_term": 1, "terminal_id": "01610060202309271357", "ultimo_uso": "2026-01-15", "ingresos": 278904, "transacciones": 669, "promedio": 416.8968609865471, "dias_sin_uso": 39}, {"cliente": "Tonys Restaurante", "num_term": 2, "terminal_id": "01610060202309271282", "ultimo_uso": "2026-01-07", "ingresos": 274800.44999999995, "transacciones": 84, "promedio": 3271.433928571428, "dias_sin_uso": 47}, {"cliente": "HE", "num_term": 1, "terminal_id": "01610060202309270570", "ultimo_uso": "2026-02-19", "ingresos": 255002.83999999994, "transacciones": 259, "promedio": 984.5669498069495, "dias_sin_uso": 4}, {"cliente": "Empire Fitness Torres Medicas", "num_term": 1, "terminal_id": "01610015202405212277", "ultimo_uso": "2026-01-16", "ingresos": 253263, "transacciones": 508, "promedio": 498.5492125984252, "dias_sin_uso": 38}, {"cliente": "Empire Fitness Cholula", "num_term": 1, "terminal_id": "01610060202309270414", "ultimo_uso": "2026-01-15", "ingresos": 251316, "transacciones": 423, "promedio": 594.1276595744681, "dias_sin_uso": 39}, {"cliente": "Empire Fitness Estambres", "num_term": 1, "terminal_id": "01610060202309270897", "ultimo_uso": "2026-02-06", "ingresos": 228221, "transacciones": 407, "promedio": 560.7395577395578, "dias_sin_uso": 17}, {"cliente": "SIEMBRA COMEDOR", "num_term": 1, "terminal_id": "01610060202309270304", "ultimo_uso": "2026-02-11", "ingresos": 215724.45, "transacciones": 893, "promedio": 241.57273236282197, "dias_sin_uso": 12}, {"cliente": "Casa Mexicana", "num_term": 3, "terminal_id": "01610015202405211090", "ultimo_uso": "2026-02-19", "ingresos": 213702, "transacciones": 20, "promedio": 10685.1, "dias_sin_uso": 4}, {"cliente": "Tintoreria Easy Clean", "num_term": 2, "terminal_id": "01610015202405210903", "ultimo_uso": "2026-02-19", "ingresos": 211152, "transacciones": 312, "promedio": 676.7692307692307, "dias_sin_uso": 4}, {"cliente": "MOLIENDA SAGRADA", "num_term": 1, "terminal_id": "01610015202405210923", "ultimo_uso": "2026-02-20", "ingresos": 201201.4899999999, "transacciones": 285, "promedio": 705.9701403508768, "dias_sin_uso": 3}, {"cliente": "CONSULTORIO MEDICO DR DAVID FIGUEROA", "num_term": 1, "terminal_id": "01610015202405212262", "ultimo_uso": "2026-02-20", "ingresos": 191900, "transacciones": 124, "promedio": 1547.5806451612902, "dias_sin_uso": 3}, {"cliente": "Dentista Ninos", "num_term": 1, "terminal_id": "01610060202309270337", "ultimo_uso": "2026-02-19", "ingresos": 182260, "transacciones": 96, "promedio": 1898.5416666666667, "dias_sin_uso": 4}, {"cliente": "Funky Mama", "num_term": 1, "terminal_id": "01610060202309270831", "ultimo_uso": "2026-02-18", "ingresos": 177322.94999999998, "transacciones": 474, "promedio": 374.09905063291137, "dias_sin_uso": 5}, {"cliente": "Empire Fitness Tlaxcala", "num_term": 1, "terminal_id": "01610015202405212174", "ultimo_uso": "2026-01-17", "ingresos": 177314, "transacciones": 342, "promedio": 518.4619883040936, "dias_sin_uso": 37}, {"cliente": "Empire Fitness Heroes", "num_term": 1, "terminal_id": "01610015202405211572", "ultimo_uso": "2026-01-16", "ingresos": 172823, "transacciones": 359, "promedio": 481.4011142061281, "dias_sin_uso": 38}, {"cliente": "Yacht Cancun", "num_term": 1, "terminal_id": "01610060202309271147", "ultimo_uso": "", "ingresos": 169967.58000000002, "transacciones": 17, "promedio": 9998.092941176472, "dias_sin_uso": 3}, {"cliente": "DR JUAN DE DIOS QUIROZ", "num_term": 1, "terminal_id": "01610060202309270759", "ultimo_uso": "2026-02-20", "ingresos": 169171, "transacciones": 96, "promedio": 1762.1979166666667, "dias_sin_uso": 3}, {"cliente": "Empire Fitness Cienega", "num_term": 1, "terminal_id": "01610060202309270679", "ultimo_uso": "2026-01-15", "ingresos": 164474, "transacciones": 315, "promedio": 522.1396825396826, "dias_sin_uso": 39}, {"cliente": "HU", "num_term": 1, "terminal_id": "01610060202309270277", "ultimo_uso": "2026-02-23", "ingresos": 154778.61, "transacciones": 124, "promedio": 1248.2145967741935, "dias_sin_uso": 0}, {"cliente": "DABUTEN", "num_term": 1, "terminal_id": "01610015202405211673", "ultimo_uso": "2026-02-19", "ingresos": 150721.94000000003, "transacciones": 145, "promedio": 1039.461655172414, "dias_sin_uso": 4}, {"cliente": "Empire Fitness 31 PTE", "num_term": 1, "terminal_id": "01610060202309270703", "ultimo_uso": "2026-01-16", "ingresos": 145020, "transacciones": 268, "promedio": 541.1194029850747, "dias_sin_uso": 38}, {"cliente": "Empire Fitness Las Torres", "num_term": 1, "terminal_id": "01610060202309270922", "ultimo_uso": "2026-01-15", "ingresos": 139091.9, "transacciones": 348, "promedio": 399.68936781609193, "dias_sin_uso": 39}, {"cliente": "Empire Fitness Vive la Cienega", "num_term": 1, "terminal_id": "01610015202405212272", "ultimo_uso": "2026-01-15", "ingresos": 139065, "transacciones": 236, "promedio": 589.2584745762712, "dias_sin_uso": 39}, {"cliente": "NUTRIMET CUAUTLANCINGO", "num_term": 1, "terminal_id": "01610060202309270931", "ultimo_uso": "2026-02-19", "ingresos": 137914.2, "transacciones": 96, "promedio": 1436.60625, "dias_sin_uso": 4}, {"cliente": "Joyeria Zafiro", "num_term": 1, "terminal_id": "01610015202405211534", "ultimo_uso": "2026-02-19", "ingresos": 132233, "transacciones": 8, "promedio": 16529.125, "dias_sin_uso": 4}, {"cliente": "Empire Fitness Tlahuac", "num_term": 1, "terminal_id": "01610060202309270512", "ultimo_uso": "2026-01-16", "ingresos": 128079, "transacciones": 124, "promedio": 1032.8951612903227, "dias_sin_uso": 38}, {"cliente": "C CUMBRES", "num_term": 9, "terminal_id": "01610015202405211522", "ultimo_uso": "2026-02-20", "ingresos": 128003.45, "transacciones": 498, "promedio": 257.03504016064255, "dias_sin_uso": 3}, {"cliente": "UrbanOutled", "num_term": 5, "terminal_id": "01610015202405210940", "ultimo_uso": "", "ingresos": 125011.20000000001, "transacciones": 177, "promedio": 706.277966101695, "dias_sin_uso": 4}, {"cliente": "GRUPO VITALIS", "num_term": 1, "terminal_id": "01610060202309271416", "ultimo_uso": "2026-02-19", "ingresos": 124385.04, "transacciones": 72, "promedio": 1727.57, "dias_sin_uso": 4}, {"cliente": "Empire Fitness Finsa", "num_term": 1, "terminal_id": "01610060202309270320", "ultimo_uso": "2026-01-15", "ingresos": 123084, "transacciones": 222, "promedio": 554.4324324324324, "dias_sin_uso": 39}, {"cliente": "LA CANTADA", "num_term": 8, "terminal_id": "01610015202405210936", "ultimo_uso": "2026-02-23", "ingresos": 119671.95, "transacciones": 90, "promedio": 1329.6883333333333, "dias_sin_uso": 0}, {"cliente": "DUMEDIC", "num_term": 2, "terminal_id": "01610015202405210005", "ultimo_uso": "2026-02-17", "ingresos": 118709, "transacciones": 24, "promedio": 4946.208333333333, "dias_sin_uso": 6}, {"cliente": "Empire Fitness Galerias Serdan CH", "num_term": 2, "terminal_id": "01610060202309270201", "ultimo_uso": "2026-01-19", "ingresos": 115005, "transacciones": 223, "promedio": 515.7174887892377, "dias_sin_uso": 35}, {"cliente": "Dr Juan Domingo Porras", "num_term": 1, "terminal_id": "01610060202309270763", "ultimo_uso": "2026-02-20", "ingresos": 112400, "transacciones": 86, "promedio": 1306.9767441860465, "dias_sin_uso": 3}, {"cliente": "Mexico Handmade", "num_term": 1, "terminal_id": "01610015202405211508", "ultimo_uso": "2026-02-23", "ingresos": 110125, "transacciones": 16, "promedio": 6882.8125, "dias_sin_uso": 0}, {"cliente": "Clinica Dental Sonrie", "num_term": 1, "terminal_id": "01610060202309270989", "ultimo_uso": "2026-02-19", "ingresos": 101450, "transacciones": 67, "promedio": 1514.1791044776119, "dias_sin_uso": 4}, {"cliente": "Empire Fitness Guadalajara", "num_term": 1, "terminal_id": "01610015202405210912", "ultimo_uso": "2026-01-16", "ingresos": 101026, "transacciones": 211, "promedio": 478.7962085308057, "dias_sin_uso": 38}, {"cliente": "FOCACCIA", "num_term": 9, "terminal_id": "01610060202309271247", "ultimo_uso": "2026-01-16", "ingresos": 97544, "transacciones": 145, "promedio": 672.7172413793104, "dias_sin_uso": 38}, {"cliente": "BAR 7", "num_term": 1, "terminal_id": "01610015202405210003", "ultimo_uso": "2026-02-17", "ingresos": 94400, "transacciones": 4, "promedio": 23600, "dias_sin_uso": 6}, {"cliente": "ADICTO CAFE LA MINERVA", "num_term": 1, "terminal_id": "01610015202405211037", "ultimo_uso": "2026-02-06", "ingresos": 90670.55000000003, "transacciones": 436, "promedio": 207.95997706422025, "dias_sin_uso": 17}, {"cliente": "WHY WAIT", "num_term": 1, "terminal_id": "01610016202411271114", "ultimo_uso": "", "ingresos": 90165, "transacciones": 27, "promedio": 3339.4444444444443, "dias_sin_uso": 17}, {"cliente": "Empire Fitness Centro Historico", "num_term": 1, "terminal_id": "01610015202405212258", "ultimo_uso": "2026-01-16", "ingresos": 89915, "transacciones": 156, "promedio": 576.3782051282051, "dias_sin_uso": 38}, {"cliente": "TOP TENT OUTLET", "num_term": 3, "terminal_id": "01610015202405210055", "ultimo_uso": "2026-02-15", "ingresos": 89779.6, "transacciones": 97, "promedio": 925.5628865979382, "dias_sin_uso": 8}, {"cliente": "SERVICIOS MEDICOS INTEGRALES", "num_term": 1, "terminal_id": "01610060202309270765", "ultimo_uso": "2026-02-10", "ingresos": 86046.22, "transacciones": 9, "promedio": 9560.691111111111, "dias_sin_uso": 13}, {"cliente": "Topolino", "num_term": 2, "terminal_id": "01610060202309270319", "ultimo_uso": "", "ingresos": 85832.56999999998, "transacciones": 207, "promedio": 414.6500966183574, "dias_sin_uso": 3}, {"cliente": "Empire Fitness Mirador 1", "num_term": 1, "terminal_id": "01610015202405212287", "ultimo_uso": "2026-01-15", "ingresos": 85762, "transacciones": 174, "promedio": 492.88505747126436, "dias_sin_uso": 39}, {"cliente": "Hostess 4G", "num_term": 1, "terminal_id": "01610015202405210892", "ultimo_uso": "2026-01-25", "ingresos": 85000, "transacciones": 3, "promedio": 28333.333333333332, "dias_sin_uso": 29}, {"cliente": "DR RODRIGO MONROY CARVAJAL", "num_term": 1, "terminal_id": "01610015202405212252", "ultimo_uso": "2026-02-18", "ingresos": 81200, "transacciones": 42, "promedio": 1933.3333333333333, "dias_sin_uso": 5}, {"cliente": "Lucia Acapulco", "num_term": 8, "terminal_id": "01610015202405210952", "ultimo_uso": "2026-02-18", "ingresos": 76350, "transacciones": 96, "promedio": 795.3125, "dias_sin_uso": 5}, {"cliente": "HLT Services", "num_term": 1, "terminal_id": "-", "ultimo_uso": "2026-01-13", "ingresos": 71001, "transacciones": 2, "promedio": 35500.5, "dias_sin_uso": 41}, {"cliente": "HP", "num_term": 1, "terminal_id": "01610015202405211064", "ultimo_uso": "2026-02-19", "ingresos": 70918, "transacciones": 70, "promedio": 1013.1142857142858, "dias_sin_uso": 4}, {"cliente": "Empire Fitness Mirador 2", "num_term": 1, "terminal_id": "01610060202309271467", "ultimo_uso": "2026-01-15", "ingresos": 70684, "transacciones": 172, "promedio": 410.95348837209303, "dias_sin_uso": 39}, {"cliente": "DR JORGE GARCIA RENTERIA", "num_term": 1, "terminal_id": "01610015202405212176", "ultimo_uso": "2026-02-19", "ingresos": 68280, "transacciones": 44, "promedio": 1551.8181818181818, "dias_sin_uso": 4}, {"cliente": "Club PH Phonique ", "num_term": 5, "terminal_id": "01610015202405211663", "ultimo_uso": "2026-02-17", "ingresos": 64908, "transacciones": 11, "promedio": 5900.727272727273, "dias_sin_uso": 6}, {"cliente": "Constructora Brumo", "num_term": 1, "terminal_id": "01610015202405211508", "ultimo_uso": "2026-02-19", "ingresos": 64766, "transacciones": 9, "promedio": 7196.222222222223, "dias_sin_uso": 4}, {"cliente": "Luna Canela", "num_term": 6, "terminal_id": "01610015202405211060", "ultimo_uso": "2026-02-08", "ingresos": 64757, "transacciones": 94, "promedio": 688.9042553191489, "dias_sin_uso": 15}, {"cliente": "LA CRIANZA", "num_term": 3, "terminal_id": "01610016202411271651", "ultimo_uso": "2026-02-20", "ingresos": 63891.45, "transacciones": 31, "promedio": 2061.014516129032, "dias_sin_uso": 3}, {"cliente": "Super el valle", "num_term": 1, "terminal_id": "01610015202405211580", "ultimo_uso": "2026-02-19", "ingresos": 63698.5, "transacciones": 514, "promedio": 123.92704280155642, "dias_sin_uso": 4}, {"cliente": "RODANE", "num_term": 1, "terminal_id": "01610015202405211063", "ultimo_uso": "2026-02-18", "ingresos": 58222.380000000005, "transacciones": 17, "promedio": 3424.8458823529413, "dias_sin_uso": 5}, {"cliente": "Empire Fitness Fortuna", "num_term": 1, "terminal_id": "01610015202405211574", "ultimo_uso": "2026-01-16", "ingresos": 57137, "transacciones": 96, "promedio": 595.1770833333334, "dias_sin_uso": 38}, {"cliente": "Empire Fitness Ecatepec", "num_term": 1, "terminal_id": "01610015202405212136", "ultimo_uso": "2026-01-16", "ingresos": 56530, "transacciones": 105, "promedio": 538.3809523809524, "dias_sin_uso": 38}, {"cliente": "La Ruta de las Indias", "num_term": 1, "terminal_id": "01610015202405211634", "ultimo_uso": "2026-02-19", "ingresos": 55815, "transacciones": 37, "promedio": 1508.5135135135135, "dias_sin_uso": 4}, {"cliente": "CR Alimentos", "num_term": 1, "terminal_id": "01610015202405210256", "ultimo_uso": "2026-02-23", "ingresos": 55624.25, "transacciones": 128, "promedio": 434.564453125, "dias_sin_uso": 0}, {"cliente": "DR FRANCISCO JAVIER", "num_term": 1, "terminal_id": "01610060202309271221", "ultimo_uso": "2026-01-21", "ingresos": 54365, "transacciones": 28, "promedio": 1941.607142857143, "dias_sin_uso": 33}, {"cliente": "UNIDAD DE ESPECIALIDADES ORTOPEDICAS", "num_term": 1, "terminal_id": "01610015202405210930", "ultimo_uso": "", "ingresos": 54300, "transacciones": 11, "promedio": 4936.363636363636, "dias_sin_uso": 10}, {"cliente": "Templados Varsa", "num_term": 1, "terminal_id": "01610015202405212450", "ultimo_uso": "2026-02-19", "ingresos": 50800.649999999994, "transacciones": 34, "promedio": 1494.1367647058821, "dias_sin_uso": 4}, {"cliente": "CACHITO LINDO Y QUERIDO", "num_term": 2, "terminal_id": "01610015202405210944", "ultimo_uso": "2026-01-03", "ingresos": 50633, "transacciones": 33, "promedio": 1534.3333333333333, "dias_sin_uso": 51}, {"cliente": "ECODEN", "num_term": 1, "terminal_id": "01610015202405211503", "ultimo_uso": "2026-02-19", "ingresos": 48600, "transacciones": 55, "promedio": 883.6363636363636, "dias_sin_uso": 4}, {"cliente": "AMOBA", "num_term": 2, "terminal_id": "01610015202405212246", "ultimo_uso": "2026-01-09", "ingresos": 48044.5, "transacciones": 337, "promedio": 142.5652818991098, "dias_sin_uso": 45}, {"cliente": "Box Box Car Service", "num_term": 2, "terminal_id": "01610050202309050002", "ultimo_uso": "2026-02-04", "ingresos": 47047.12, "transacciones": 17, "promedio": 2767.4776470588235, "dias_sin_uso": 19}, {"cliente": "INSTITUTO PANAMERICANO DEL CORAZON", "num_term": 1, "terminal_id": "01610060202309270068", "ultimo_uso": "2026-02-03", "ingresos": 42900, "transacciones": 21, "promedio": 2042.857142857143, "dias_sin_uso": 20}, {"cliente": "ARKO PAYMENT SOLUTIONS", "num_term": 5, "terminal_id": "01610016202411271227", "ultimo_uso": "2026-02-20", "ingresos": 38067, "transacciones": 70, "promedio": 543.8142857142857, "dias_sin_uso": 3}, {"cliente": "NUTRISIM", "num_term": 1, "terminal_id": "01610015202405212261", "ultimo_uso": "2026-02-19", "ingresos": 38060.33, "transacciones": 12, "promedio": 3171.6941666666667, "dias_sin_uso": 4}, {"cliente": "Mt Mechanics", "num_term": 1, "terminal_id": "01610060202309270015", "ultimo_uso": "2026-02-19", "ingresos": 35688.020000000004, "transacciones": 10, "promedio": 3568.8020000000006, "dias_sin_uso": 4}, {"cliente": "Empire Fitness Acocota", "num_term": 1, "terminal_id": "01610015202405211038", "ultimo_uso": "2026-01-16", "ingresos": 33927, "transacciones": 51, "promedio": 665.2352941176471, "dias_sin_uso": 38}, {"cliente": "WHY WAIT ", "num_term": 1, "terminal_id": "01610016202411271114", "ultimo_uso": "", "ingresos": 33500, "transacciones": 7, "promedio": 4785.714285714285, "dias_sin_uso": 4}, {"cliente": "Freshify", "num_term": 2, "terminal_id": "01610060202309270306", "ultimo_uso": "2026-02-10", "ingresos": 33322.979999999996, "transacciones": 18, "promedio": 1851.2766666666664, "dias_sin_uso": 13}, {"cliente": "Quesos Chiapas 2", "num_term": 1, "terminal_id": "01610015202405211039", "ultimo_uso": "2026-02-05", "ingresos": 33130.41, "transacciones": 73, "promedio": 453.84123287671235, "dias_sin_uso": 18}, {"cliente": "CONVENIA LINKS DE PAGO", "num_term": 1, "terminal_id": "-", "ultimo_uso": "2026-01-27", "ingresos": 33000, "transacciones": 1, "promedio": 33000, "dias_sin_uso": 27}, {"cliente": "DR FERNANDO ZARAIN", "num_term": 1, "terminal_id": "01610015202405211058", "ultimo_uso": "2026-02-19", "ingresos": 32600, "transacciones": 27, "promedio": 1207.4074074074074, "dias_sin_uso": 4}, {"cliente": "Todo Corazon ", "num_term": 1, "terminal_id": "01610015202405211066", "ultimo_uso": "2026-02-19", "ingresos": 30964, "transacciones": 34, "promedio": 910.7058823529412, "dias_sin_uso": 4}, {"cliente": "FOCCA 2", "num_term": 1, "terminal_id": "01610016202411271723", "ultimo_uso": "2026-02-17", "ingresos": 30217.410000000003, "transacciones": 71, "promedio": 425.59732394366205, "dias_sin_uso": 6}, {"cliente": "HS", "num_term": 1, "terminal_id": "01610060202309270546", "ultimo_uso": "2026-02-10", "ingresos": 30138, "transacciones": 24, "promedio": 1255.75, "dias_sin_uso": 13}, {"cliente": "DR GERARDO CASTORENA ROJI", "num_term": 1, "terminal_id": "01610015202405212121", "ultimo_uso": "2026-02-17", "ingresos": 29000, "transacciones": 27, "promedio": 1074.0740740740741, "dias_sin_uso": 6}, {"cliente": "MJ", "num_term": 1, "terminal_id": "01610015202405211098", "ultimo_uso": "2026-02-20", "ingresos": 28950.01, "transacciones": 83, "promedio": 348.7953012048193, "dias_sin_uso": 3}, {"cliente": "FLAMINGOS PALACE", "num_term": 3, "terminal_id": "01610016202411270422", "ultimo_uso": "2026-02-20", "ingresos": 28540, "transacciones": 65, "promedio": 439.0769230769231, "dias_sin_uso": 3}, {"cliente": "Empire Fitness San Martin", "num_term": 1, "terminal_id": "01610060202309270229", "ultimo_uso": "2026-01-15", "ingresos": 24751, "transacciones": 28, "promedio": 883.9642857142857, "dias_sin_uso": 39}, {"cliente": "PADEL WORLD", "num_term": 2, "terminal_id": "01610016202411270606", "ultimo_uso": "2026-02-19", "ingresos": 23570, "transacciones": 56, "promedio": 420.89285714285717, "dias_sin_uso": 4}, {"cliente": "FEDEDOME", "num_term": 1, "terminal_id": "01610060202309270739", "ultimo_uso": "2026-01-29", "ingresos": 22868, "transacciones": 24, "promedio": 952.8333333333334, "dias_sin_uso": 25}, {"cliente": "Club PH Phonique", "num_term": 6, "terminal_id": "01610015202405211663", "ultimo_uso": "2026-02-05", "ingresos": 21628.010000000002, "transacciones": 11, "promedio": 1966.1827272727276, "dias_sin_uso": 18}, {"cliente": "SANTUARIO PIO", "num_term": 2, "terminal_id": "01610060202309271259", "ultimo_uso": "2026-02-18", "ingresos": 20955, "transacciones": 26, "promedio": 805.9615384615385, "dias_sin_uso": 5}, {"cliente": "Wallfine", "num_term": 1, "terminal_id": "01610050202309050270", "ultimo_uso": "", "ingresos": 18501.15, "transacciones": 3, "promedio": 6167.05, "dias_sin_uso": 4}, {"cliente": "Hacienda Soleil", "num_term": 1, "terminal_id": "01610060202309270652", "ultimo_uso": "2026-02-19", "ingresos": 17802.199999999997, "transacciones": 14, "promedio": 1271.5857142857142, "dias_sin_uso": 4}, {"cliente": "MONTAJES OPERATIVOS", "num_term": 1, "terminal_id": "01610060202309270142", "ultimo_uso": "2026-02-19", "ingresos": 17470.22, "transacciones": 250, "promedio": 69.88088, "dias_sin_uso": 4}, {"cliente": "COCINA MONTEJO", "num_term": 1, "terminal_id": "01610015202405211098", "ultimo_uso": "2026-01-20", "ingresos": 15992, "transacciones": 8, "promedio": 1999, "dias_sin_uso": 34}, {"cliente": "ELEVEN PEOPLE", "num_term": 3, "terminal_id": "01610015202405211660", "ultimo_uso": "2026-02-20", "ingresos": 15186, "transacciones": 5, "promedio": 3037.2, "dias_sin_uso": 3}, {"cliente": "Box Box Car Service ", "num_term": 1, "terminal_id": "01610050202309050002", "ultimo_uso": "2026-02-19", "ingresos": 14198.39, "transacciones": 5, "promedio": 2839.678, "dias_sin_uso": 4}, {"cliente": "DR FELIX URBINA", "num_term": 1, "terminal_id": "01610060202309270724", "ultimo_uso": "2026-02-19", "ingresos": 12300, "transacciones": 14, "promedio": 878.5714285714286, "dias_sin_uso": 4}, {"cliente": "CONSULTA MEDICA DU", "num_term": 1, "terminal_id": "01610015202405212175", "ultimo_uso": "2026-02-19", "ingresos": 11800, "transacciones": 9, "promedio": 1311.111111111111, "dias_sin_uso": 4}, {"cliente": "Bar La Oficina", "num_term": 1, "terminal_id": "01610016202411271135", "ultimo_uso": "2026-01-23", "ingresos": 11101, "transacciones": 23, "promedio": 482.6521739130435, "dias_sin_uso": 31}, {"cliente": "Frans Automotive", "num_term": 1, "terminal_id": "01610016202411270793", "ultimo_uso": "2026-02-05", "ingresos": 10710, "transacciones": 6, "promedio": 1785, "dias_sin_uso": 18}, {"cliente": "DR JESUS PONCE ONCOPEDIA", "num_term": 1, "terminal_id": "01610015202405210011", "ultimo_uso": "2026-02-19", "ingresos": 10300, "transacciones": 7, "promedio": 1471.4285714285713, "dias_sin_uso": 4}, {"cliente": "Quesos Chiapas", "num_term": 1, "terminal_id": "01610060202309270236", "ultimo_uso": "2026-02-07", "ingresos": 9662, "transacciones": 5, "promedio": 1932.4, "dias_sin_uso": 16}, {"cliente": "Centro Joyero Centenario", "num_term": 1, "terminal_id": "01610016202411271092", "ultimo_uso": "2026-02-03", "ingresos": 9378, "transacciones": 2, "promedio": 4689, "dias_sin_uso": 20}, {"cliente": "UROLOGIA FUNCIONAL", "num_term": 1, "terminal_id": "01610015202405210942", "ultimo_uso": "", "ingresos": 9000, "transacciones": 12, "promedio": 750, "dias_sin_uso": 42}, {"cliente": "Quesos Chiapas 2 ", "num_term": 1, "terminal_id": "01610015202405211039", "ultimo_uso": "2026-02-23", "ingresos": 7489, "transacciones": 19, "promedio": 394.1578947368421, "dias_sin_uso": 0}, {"cliente": "AJEDREZ", "num_term": 1, "terminal_id": "-", "ultimo_uso": "2026-02-04", "ingresos": 7180, "transacciones": 4, "promedio": 1795, "dias_sin_uso": 19}, {"cliente": "Potato Shop", "num_term": 1, "terminal_id": "-", "ultimo_uso": "2026-02-04", "ingresos": 7000, "transacciones": 2, "promedio": 3500, "dias_sin_uso": 19}, {"cliente": "Hotel Casa Real ", "num_term": 1, "terminal_id": "01610060202309270858", "ultimo_uso": "2026-02-19", "ingresos": 6925, "transacciones": 11, "promedio": 629.5454545454545, "dias_sin_uso": 4}, {"cliente": "BLACKHAWK", "num_term": 1, "terminal_id": "01610015202405211052", "ultimo_uso": "2026-02-19", "ingresos": 6680, "transacciones": 14, "promedio": 477.14285714285717, "dias_sin_uso": 4}, {"cliente": "ANTOJO GULA", "num_term": 1, "terminal_id": "01610015202405211073", "ultimo_uso": "2026-02-19", "ingresos": 6639.5, "transacciones": 41, "promedio": 161.9390243902439, "dias_sin_uso": 4}, {"cliente": "Playa Kaleta Restaurante", "num_term": 1, "terminal_id": "01610016202411270863", "ultimo_uso": "2026-02-01", "ingresos": 6440.700000000001, "transacciones": 6, "promedio": 1073.45, "dias_sin_uso": 22}, {"cliente": "Manik Odontologia", "num_term": 1, "terminal_id": "01610015202405211429", "ultimo_uso": "2026-02-19", "ingresos": 6250, "transacciones": 9, "promedio": 694.4444444444445, "dias_sin_uso": 4}, {"cliente": "Dr Rogelio Herrera Lima", "num_term": 1, "terminal_id": "01610015202405210908", "ultimo_uso": "2026-02-06", "ingresos": 5000, "transacciones": 1, "promedio": 5000, "dias_sin_uso": 17}, {"cliente": "OTORRINO LOMAS", "num_term": 1, "terminal_id": "01610060202309271292", "ultimo_uso": "2026-02-03", "ingresos": 4930, "transacciones": 1, "promedio": 4930, "dias_sin_uso": 20}, {"cliente": "Nutriment 11 sur", "num_term": 1, "terminal_id": "01610060202309270414", "ultimo_uso": "2026-02-19", "ingresos": 4734, "transacciones": 4, "promedio": 1183.5, "dias_sin_uso": 4}, {"cliente": "DENTALYSS CENTER", "num_term": 1, "terminal_id": "01610060202309270626", "ultimo_uso": "2026-02-18", "ingresos": 4500, "transacciones": 1, "promedio": 4500, "dias_sin_uso": 5}, {"cliente": "Hotel Casa Real", "num_term": 1, "terminal_id": "01610060202309270858", "ultimo_uso": "2026-02-05", "ingresos": 3970, "transacciones": 15, "promedio": 264.6666666666667, "dias_sin_uso": 18}, {"cliente": "Iglesia Cristiana", "num_term": 1, "terminal_id": "01610016202411270987", "ultimo_uso": "2026-02-19", "ingresos": 3913, "transacciones": 37, "promedio": 105.75675675675676, "dias_sin_uso": 4}, {"cliente": "ONOLOA POKE HOUSE", "num_term": 1, "terminal_id": "01610060202309271128", "ultimo_uso": "2026-01-16", "ingresos": 1844.5, "transacciones": 7, "promedio": 263.5, "dias_sin_uso": 38}, {"cliente": "Ferba Sports ", "num_term": 1, "terminal_id": "01610060202309270740", "ultimo_uso": "2026-02-11", "ingresos": 500, "transacciones": 2, "promedio": 250, "dias_sin_uso": 12}, {"cliente": "FRESH SOLUTIONS", "num_term": 1, "terminal_id": "01610015202405211657", "ultimo_uso": "2026-01-23", "ingresos": 500, "transacciones": 1, "promedio": 500, "dias_sin_uso": 31}, {"cliente": "La Calle", "num_term": 1, "terminal_id": "01610016202411271924", "ultimo_uso": "2026-02-12", "ingresos": 200, "transacciones": 1, "promedio": 200, "dias_sin_uso": 11}, {"cliente": "PadelMatch", "num_term": 1, "terminal_id": "-", "ultimo_uso": "2026-02-12", "ingresos": 80, "transacciones": 16, "promedio": 5, "dias_sin_uso": 11}, {"cliente": "Ferba Sports", "num_term": 1, "terminal_id": "01610060202309270740", "ultimo_uso": "2026-02-04", "ingresos": 50, "transacciones": 1, "promedio": 50, "dias_sin_uso": 19}, {"cliente": "7 Cielos", "num_term": 1, "terminal_id": "01610015202405211514", "ultimo_uso": "2026-01-28", "ingresos": 30, "transacciones": 3, "promedio": 10, "dias_sin_uso": 26}, {"cliente": "Rest B", "num_term": 1, "terminal_id": "01610060202309271429", "ultimo_uso": "2026-01-20", "ingresos": 20, "transacciones": 4, "promedio": 5, "dias_sin_uso": 34}, {"cliente": "Centum Cabo", "num_term": 1, "terminal_id": "01610015202405211483", "ultimo_uso": "2026-01-19", "ingresos": 11, "transacciones": 1, "promedio": 11, "dias_sin_uso": 35}, {"cliente": "Amo Tulum Tours", "num_term": 2, "terminal_id": "-", "ultimo_uso": "2026-01-28", "ingresos": 10, "transacciones": 1, "promedio": 10, "dias_sin_uso": 26}, {"cliente": "La Ruta De Las Indias SF", "num_term": 1, "terminal_id": "01610015202405210271", "ultimo_uso": "2026-02-14", "ingresos": 10, "transacciones": 1, "promedio": 10, "dias_sin_uso": 9}, {"cliente": "Focca", "num_term": 1, "terminal_id": "01610015202405212264", "ultimo_uso": "2026-01-23", "ingresos": 1, "transacciones": 1, "promedio": 1, "dias_sin_uso": 31}, {"cliente": "Poch del Huach Centro", "num_term": 1, "terminal_id": "01610015202405210951", "ultimo_uso": "2026-01-20", "ingresos": 1, "transacciones": 1, "promedio": 1, "dias_sin_uso": 34}, {"cliente": "SANTO CHANCHO", "num_term": 1, "terminal_id": "01610060202309270840", "ultimo_uso": "2026-01-14", "ingresos": 1, "transacciones": 1, "promedio": 1, "dias_sin_uso": 40}, {"cliente": "Viajes CEUNI", "num_term": 2, "terminal_id": "01610060202309270832", "ultimo_uso": "", "ingresos": 1, "transacciones": 1, "promedio": 1, "dias_sin_uso": 33}, {"cliente": "WICHO", "num_term": 1, "terminal_id": "01610016202411270426", "ultimo_uso": "", "ingresos": 1, "transacciones": 2, "promedio": 0.5, "dias_sin_uso": 31}, {"cliente": "JPART", "num_term": 1, "terminal_id": "01610060202309270501", "ultimo_uso": "2026-02-04", "ingresos": 0.02, "transacciones": 2, "promedio": 0.01, "dias_sin_uso": 19}, {"cliente": "Tony2", "num_term": 2, "terminal_id": "01610015202405211529", "ultimo_uso": "2026-01-23", "ingresos": 0.01, "transacciones": 1, "promedio": 0.01, "dias_sin_uso": 31}, {"cliente": "Centum Capital", "num_term": 2, "terminal_id": "01610015202405211525", "ultimo_uso": "2026-01-15", "ingresos": 0, "transacciones": 2, "promedio": 0, "dias_sin_uso": 39}, {"cliente": "Opulance Cabo", "num_term": 1, "terminal_id": "01610015202405211015", "ultimo_uso": "2026-02-09", "ingresos": 0, "transacciones": 2, "promedio": 0, "dias_sin_uso": 14}];
const TPV_CAMBIOS     = [{"num": 1, "terminal": "01610015202405211076", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 35, "monto_ant": 27063, "tipo": "⚠️ Solapamiento", "cliente_act": "Del Valle", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-01-22", "txns_act": 210}, {"num": 2, "terminal": "01610015202405211296", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-17", "txns_ant": 21, "monto_ant": 90555, "tipo": "⚠️ Solapamiento", "cliente_act": "Del Valle", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-01-26", "txns_act": 193}, {"num": 3, "terminal": "01610015202405211508", "cliente_ant": "Mexico Handmade", "fecha_ant_ini": "2026-01-09", "fecha_ant_fin": "2026-01-13", "txns_ant": 16, "monto_ant": 110125, "tipo": "⚠️ Solapamiento", "cliente_act": "Constructora Brumo", "fecha_act_ini": "2026-01-12", "fecha_act_fin": "2026-02-02", "txns_act": 9}, {"num": 4, "terminal": "01610015202405211522", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 8, "monto_ant": 2692.5, "tipo": "⚠️ Solapamiento", "cliente_act": "C CUMBRES", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-02-11", "txns_act": 440}, {"num": 5, "terminal": "01610015202405211525", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-16", "fecha_ant_fin": "2026-01-18", "txns_ant": 9, "monto_ant": 3330, "tipo": "⚠️ Solapamiento", "cliente_act": "C CUMBRES", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-02-10", "txns_act": 883}, {"num": 6, "terminal": "01610015202405211599", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 22, "monto_ant": 28770, "tipo": "⚠️ Solapamiento", "cliente_act": "C CUMBRES", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-02-09", "txns_act": 644}, {"num": 7, "terminal": "01610050202309050195", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 126, "monto_ant": 95687, "tipo": "⚠️ Solapamiento", "cliente_act": "C CUMBRES", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-02-09", "txns_act": 1789}, {"num": 8, "terminal": "01610050202309050271", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 61, "monto_ant": 37795, "tipo": "⚠️ Solapamiento", "cliente_act": "C CUMBRES", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-02-08", "txns_act": 1723}, {"num": 9, "terminal": "01610060202309270501", "cliente_ant": "Luna Canela", "fecha_ant_ini": "2026-01-01", "fecha_ant_fin": "2026-02-04", "txns_ant": 24, "monto_ant": 51113.2, "tipo": "⚠️ Solapamiento", "cliente_act": "JPART", "fecha_act_ini": "2026-02-04", "fecha_act_fin": "2026-02-04", "txns_act": 2}, {"num": 10, "terminal": "01610060202309271247", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 145, "monto_ant": 97544, "tipo": "⚠️ Solapamiento", "cliente_act": "C CUMBRES", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-02-09", "txns_act": 2139}, {"num": 11, "terminal": "01610060202309271429", "cliente_ant": "Rest B", "fecha_ant_ini": "2026-01-14", "fecha_ant_fin": "2026-01-20", "txns_ant": 4, "monto_ant": 20, "tipo": "⚠️ Solapamiento", "cliente_act": "Viajes CEUNI", "fecha_act_ini": "2026-01-19", "fecha_act_fin": "2026-01-21", "txns_act": 2}, {"num": 12, "terminal": "01610080202310110215", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 26, "monto_ant": 21784, "tipo": "⚠️ Solapamiento", "cliente_act": "Del Valle", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-01-22", "txns_act": 260}, {"num": 13, "terminal": "01610015202405211085", "cliente_ant": "Tony2", "fecha_ant_ini": "2026-01-23", "fecha_ant_fin": "2026-01-23", "txns_ant": 1, "monto_ant": 1.1, "tipo": "✅ Limpio", "cliente_act": "Club PH Phonique", "fecha_act_ini": "2026-01-30", "fecha_act_fin": "2026-02-08", "txns_act": 6}, {"num": 14, "terminal": "01610015202405211098", "cliente_ant": "COCINA MONTEJO", "fecha_ant_ini": "2026-01-07", "fecha_ant_fin": "2026-01-20", "txns_ant": 8, "monto_ant": 15992, "tipo": "✅ Limpio", "cliente_act": "MJ", "fecha_act_ini": "2026-01-21", "fecha_act_fin": "2026-02-07", "txns_act": 81}, {"num": 15, "terminal": "01610015202405211525", "cliente_ant": "Centum Capital", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-15", "txns_ant": 2, "monto_ant": 0, "tipo": "✅ Limpio", "cliente_act": "FOCACCIA", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-01-18", "txns_act": 9}, {"num": 16, "terminal": "01610060202309270015", "cliente_ant": "Luna Canela", "fecha_ant_ini": "2026-01-07", "fecha_ant_fin": "2026-01-29", "txns_ant": 7, "monto_ant": 3.24, "tipo": "✅ Limpio", "cliente_act": "Mt Mechanics", "fecha_act_ini": "2026-02-02", "fecha_act_fin": "2026-02-07", "txns_act": 8}, {"num": 17, "terminal": "01610060202309270414", "cliente_ant": "Empire Fitness Cholula", "fecha_ant_ini": "2025-12-31", "fecha_ant_fin": "2026-01-15", "txns_ant": 423, "monto_ant": 251316, "tipo": "✅ Limpio", "cliente_act": "Nutriment 11 sur", "fecha_act_ini": "2026-02-05", "fecha_act_fin": "2026-02-06", "txns_act": 4}];

function fmtTPV(n){n=parseFloat(n)||0;if(Math.abs(n)>=1e6)return'$'+(n/1e6).toFixed(1)+'M';if(Math.abs(n)>=1000)return'$'+(n/1000).toFixed(0)+'K';return'$'+n.toFixed(0);}
function fmtTPVFull(n){return n?'$'+parseFloat(n).toLocaleString('es-MX',{minimumFractionDigits:0,maximumFractionDigits:0}):'—';}

function filterTPVTable(tbodyId,q){
  document.getElementById(tbodyId).querySelectorAll('tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q.toLowerCase())?'':'none';});
}

function initTPVTables(){
  const render=(id,arr)=>{
    const el=document.getElementById(id);if(!el)return;
    el.innerHTML=arr.map((c,i)=>`<tr>
      <td style="color:var(--muted);font-size:.72rem">${i+1}</td>
      <td class="bld">${c.cliente}</td>
      <td class="mo">${c.monto_tc>0?fmtTPVFull(c.monto_tc):'—'}</td>
      <td class="mo">${c.monto_td>0?fmtTPVFull(c.monto_td):'—'}</td>
      <td class="mo">${c.monto_amex>0?fmtTPVFull(c.monto_amex):'—'}</td>
      <td class="mo bld pos">${fmtTPVFull(c.total)}</td></tr>`).join('');
  };
  render('dg-tbody',TPV_DG_CLIENTS);
  render('dd-tbody',TPV_D_CLIENTS);
}


function rTPVAgentes(){
  const tbody=document.getElementById('agentes-tbody');if(!tbody)return;
  const totV=TPV_AGENTES.reduce((a,ag)=>a+ag.vendido,0);
  const totC=TPV_AGENTES.reduce((a,ag)=>a+ag.com_agente,0);
  const totPend=TPV_AGENTES.reduce((a,ag)=>a+ag.pendiente,0);
  const kEl=document.getElementById('agentes-kpis');
  if(kEl)kEl.innerHTML=`
    <div class="tpv-kpi" style="border-top:3px solid #0073ea"><div class="tpv-kpi-lbl">Agentes</div><div class="tpv-kpi-val" style="color:#0073ea">${TPV_AGENTES.length}</div></div>
    <div class="tpv-kpi" style="border-top:3px solid var(--green)"><div class="tpv-kpi-lbl">Total Vendido</div><div class="tpv-kpi-val" style="color:var(--green)">${fmtTPV(totV)}</div></div>
    <div class="tpv-kpi" style="border-top:3px solid var(--orange)"><div class="tpv-kpi-lbl">Com. Total Agentes</div><div class="tpv-kpi-val" style="color:var(--orange)">${fmtTPV(totC)}</div></div>
    <div class="tpv-kpi" style="border-top:3px solid var(--red)"><div class="tpv-kpi-lbl">Pendiente Pago</div><div class="tpv-kpi-val" style="color:var(--red)">${fmtTPV(totPend)}</div></div>`;
  tbody.innerHTML=TPV_AGENTES.map(ag=>{
    const badge=ag.pendiente<=0?'<span class="tpv-badge-ok">Al día</span>':`<span class="tpv-badge-warn">${fmtTPVFull(ag.pendiente)}</span>`;
    return`<tr>
      <td class="bld">${ag.agente}</td>
      <td><span style="font-size:.67rem;background:var(--blue-bg);color:#0060b8;border:1px solid var(--blue-lt);padding:1px 7px;border-radius:10px;font-weight:700">${ag.siglas}</span></td>
      <td class="mo">${(ag.pct*100).toFixed(0)}%</td>
      <td class="mo bld">${fmtTPVFull(ag.vendido)}</td>
      <td class="mo">${fmtTPVFull(ag.com_salem)}</td>
      <td class="mo pos">${fmtTPVFull(ag.com_agente)}</td>
      <td class="mo" style="text-align:center">${ag.clientes}</td>
      <td class="mo" style="text-align:center">${ag.activos}</td>
      <td class="mo pos">${ag.pagado>0?fmtTPVFull(ag.pagado):'—'}</td>
      <td>${badge}</td></tr>`;
  }).join('');
}

function rTPVTerminales(){
  const tbody=document.getElementById('term-tbody');if(!tbody)return;
  tbody.innerHTML=TPV_TERMINALES.map(t=>{
    const dias=t.dias_sin_uso||0;
    const badge=dias<=14?'<span class="tpv-badge-ok">Activa</span>':dias<=30?`<span class="tpv-badge-warn">${dias}d sin uso</span>`:`<span class="tpv-badge-inact">Inactiva ${dias}d</span>`;
    const tid=t.terminal_id&&t.terminal_id!=='-'&&t.terminal_id!=='None'?`<span style="font-family:monospace;font-size:.67rem;color:var(--muted)">${t.terminal_id.slice(-10)}</span>`:'—';
    return`<tr>
      <td class="bld">${t.cliente}</td>
      <td class="mo" style="text-align:center">${t.num_term}</td>
      <td>${tid}</td>
      <td style="font-size:.73rem">${t.ultimo_uso||'—'}</td>
      <td class="mo pos bld">${t.ingresos>0?fmtTPVFull(t.ingresos):'—'}</td>
      <td class="mo" style="text-align:center">${t.transacciones>0?t.transacciones.toLocaleString():'—'}</td>
      <td class="mo">${t.promedio>0?'$'+t.promedio.toFixed(0):'—'}</td>
      <td class="mo" style="text-align:center;color:${dias>30?'var(--red)':dias>14?'var(--orange)':'var(--green)'}">${dias||'—'}</td>
      <td>${badge}</td></tr>`;
  }).join('');
}

function rTPVCambios(){
  const tbody=document.getElementById('cambios-tbody');if(!tbody)return;
  tbody.innerHTML=TPV_CAMBIOS.map(c=>{
    const badge=c.tipo.includes('⚠️')?'<span class="tpv-badge-warn">⚠️ Solapamiento</span>':'<span class="tpv-badge-ok">✅ Limpio</span>';
    const tid=c.terminal?c.terminal.slice(-12):'-';
    return`<tr style="${c.tipo.includes('⚠️')?'background:rgba(255,152,0,.04)':''}">
      <td style="color:var(--muted);font-size:.72rem">${c.num}</td>
      <td><span style="font-family:monospace;font-size:.67rem;color:var(--muted)">${tid}</span></td>
      <td class="bld">${c.cliente_ant||'—'}</td>
      <td style="font-size:.73rem">${c.fecha_ant_ini}</td>
      <td style="font-size:.73rem">${c.fecha_ant_fin}</td>
      <td class="mo" style="text-align:center">${c.txns_ant}</td>
      <td class="mo">${c.monto_ant>0?fmtTPVFull(c.monto_ant):'—'}</td>
      <td>${badge}</td>
      <td class="bld" style="color:#0073ea">${c.cliente_act||'—'}</td>
      <td style="font-size:.73rem">${c.fecha_act_ini}</td>
      <td style="font-size:.73rem">${c.fecha_act_fin}</td>
      <td class="mo" style="text-align:center">${c.txns_act}</td></tr>`;
  }).join('');
}


// ==============================
// TPV CHARTS
// ==============================
const TPV_CHARTS = {};

function initTPVCharts_general() {
  const isDark = document.body.classList.contains('dark');
  const gridC = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const textC = isDark ? '#9da0c5' : '#8b8fb5';

  if(TPV_CHARTS['top10']) TPV_CHARTS['top10'].destroy();
  TPV_CHARTS['top10'] = new Chart(document.getElementById('c-tpv-top10'), {
    type: 'bar',
    data: {
      labels: ["C Cumbres", "La Churrasca Atlix", "Del Valle", "La Cantada", "Lucia Acapulco", "TONYS RESTAURANTE", "Flamingos Palace", "Carlevaro Muebleri", "Norday Termos", "ECYQ Medical Benef"],
      datasets: [{ data: [14058828, 2272336, 1401845, 1322324, 1050979, 977002, 908373, 820195, 553199, 543863], backgroundColor: '#0073ea22', borderColor: '#0073ea', borderWidth: 1.5, borderRadius: 4 }]
    },
    options: { indexAxis:'y', plugins:{legend:{display:false}}, scales:{
      x:{ grid:{color:gridC}, ticks:{color:textC,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1000?'$'+(v/1000).toFixed(0)+'K':'$'+v} },
      y:{ grid:{display:false}, ticks:{color:textC,font:{size:9}} }
    }}
  });

  if(TPV_CHARTS['com_pie']) TPV_CHARTS['com_pie'].destroy();
  TPV_CHARTS['com_pie'] = new Chart(document.getElementById('c-tpv-com-pie'), {
    type: 'doughnut',
    data: { labels: ["Efevoo", "Salem", "Convenia", "Comisionista"], datasets: [{ data: [791922, 410826, 21851, 19518], backgroundColor:['#9b51e0','#0073ea','#ff7043','#ffa000'], borderWidth:0 }] },
    options: { cutout:'65%', plugins:{ legend:{position:'bottom',labels:{font:{size:9},color:textC,boxWidth:10,padding:8}} } }
  });
}

function initTPVCharts_dashboard() {
  const isDark = document.body.classList.contains('dark');
  const gridC = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const textC = isDark ? '#9da0c5' : '#8b8fb5';

  if(TPV_CHARTS['dd_top']) TPV_CHARTS['dd_top'].destroy();
  TPV_CHARTS['dd_top'] = new Chart(document.getElementById('c-tpv-dd-top'), {
    type: 'bar',
    data: {
      labels: ["C CUMBRES", "La Churrasca Atlix", "Del Valle", "Lucia Acapulco", "LA CANTADA", "Carlevaro Muebleri", "Tonys Restaurante", "ECyQ Medical Benef", "Mato Grosso", "Focaccia"],
      datasets: [{ data: [8313345, 2172516, 1401845, 871100, 821589, 655745, 607715, 543863, 412263, 404696], backgroundColor: '#00b87522', borderColor: '#00b875', borderWidth: 1.5, borderRadius: 4 }]
    },
    options: { indexAxis:'y', plugins:{legend:{display:false}}, scales:{
      x:{ grid:{color:gridC}, ticks:{color:textC,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1000?'$'+(v/1000).toFixed(0)+'K':'$'+v} },
      y:{ grid:{display:false}, ticks:{color:textC,font:{size:9}} }
    }}
  });

  if(TPV_CHARTS['dd_pie']) TPV_CHARTS['dd_pie'].destroy();
  TPV_CHARTS['dd_pie'] = new Chart(document.getElementById('c-tpv-dd-pie'), {
    type: 'doughnut',
    data: { labels: ["Efevoo", "Salem", "Convenia", "Comisionista"], datasets: [{ data: [557644, 285164, 16294, 14686], backgroundColor:['#9b51e0','#0073ea','#ff7043','#ffa000'], borderWidth:0 }] },
    options: { cutout:'65%', plugins:{ legend:{position:'bottom',labels:{font:{size:9},color:textC,boxWidth:10,padding:8}} } }
  });
}

function initTPVCharts_agentes() {
  const isDark = document.body.classList.contains('dark');
  const textC = isDark ? '#9da0c5' : '#8b8fb5';

  if(TPV_CHARTS['agentes']) TPV_CHARTS['agentes'].destroy();
  TPV_CHARTS['agentes'] = new Chart(document.getElementById('c-tpv-agentes'), {
    type: 'bar',
    data: {
      labels: ["Angel", "Javier", "Emiliano", "Joaquin", "Adrian", "Monica", "Jose"],
      datasets: [{ data: [19032352, 2560591, 1083200, 0, 16195961, 7000, 42792], backgroundColor: ['#0073ea','#00b875','#9b51e0','#ff7043','#ffa000','#e53935','#00b8d9'], borderWidth: 0, borderRadius: 5 }]
    },
    options: { plugins:{legend:{display:false}}, scales:{
      x:{ grid:{display:false}, ticks:{color:textC,font:{size:9}} },
      y:{ grid:{color:isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)'}, ticks:{color:textC,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1000?'$'+(v/1000).toFixed(0)+'K':'$'+v} }
    }}
  });
}



// ==============================
// TPV PAGOS — CAPTURA & LOCALSTORAGE
// ==============================

const PAGOS_KEY = 'vmcr_tpv_pagos';

// Load payments from localStorage
function pagosLoad() {
  try { return JSON.parse(localStorage.getItem(PAGOS_KEY) || '{}'); }
  catch(e) { return {}; }
}

// Save payments to localStorage
function pagosSave(data) {
  localStorage.setItem(PAGOS_KEY, JSON.stringify(data));
}

// Get total paid for a client id
function pagosTotalCliente(id, data) {
  const pagos = (data[id] || []);
  return pagos.reduce((s, p) => s + p.monto, 0);
}

// Get effective saldo for a client
function pagosSaldo(cliente) {
  const data = pagosLoad();
  const pagado = pagosTotalCliente(cliente.id, data);
  const base = cliente.monto_neto + cliente.sub_tarjeta + cliente.sub_bancario;
  return Math.max(0, base - pagado - cliente.total_pagos);
}

// ── RENDER rTPVPagos ──
function rTPVPagos() {
  const tbody = document.getElementById('pagos-tbody');
  if (!tbody) return;

  const data = pagosLoad();
  const today = new Date().toLocaleDateString('es-MX');

  // Calculate effective totals
  let totMonto = 0, totPagado = 0, totPend = 0, conSaldo = 0;
  const rows = TPV_PAGOS.map(p => {
    const extraPagado = pagosTotalCliente(p.id, data);
    const totalPagado = p.total_pagos + extraPagado;
    const saldo = Math.max(0, p.monto_neto + p.sub_tarjeta + p.sub_bancario - totalPagado);
    totMonto  += p.monto_neto;
    totPagado += totalPagado;
    totPend   += saldo;
    if (saldo > 0) conSaldo++;
    return { ...p, _totalPagado: totalPagado, _saldo: saldo, _nPagos: (data[p.id] || []).length };
  });

  // KPIs
  const kEl = document.getElementById('tpv-pagos-kpis');
  if (kEl) kEl.innerHTML = `
    <div class="kpi-card" style="--ac:#0073ea">
      <div class="kpi-top"><div class="kpi-lbl">Total Monto Neto</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">💰</div></div>
      <div class="kpi-val" style="color:#0073ea">${fmtTPV(totMonto)}</div>
      <div class="kpi-d dnu">${TPV_PAGOS.length} clientes</div>
      <div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:var(--green)">
      <div class="kpi-top"><div class="kpi-lbl">Total Pagado</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">✅</div></div>
      <div class="kpi-val" style="color:var(--green)">${fmtTPV(totPagado)}</div>
      <div class="kpi-d dup">${(totPagado/totMonto*100).toFixed(1)}% liquidado</div>
      <div class="kbar"><div class="kfill" style="background:var(--green);width:${Math.min(totPagado/totMonto*100,100).toFixed(0)}%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:var(--red)">
      <div class="kpi-top"><div class="kpi-lbl">Saldo Pendiente</div><div class="kpi-ico" style="background:var(--red-bg);color:var(--red)">⏳</div></div>
      <div class="kpi-val" style="color:var(--red)">${fmtTPV(totPend)}</div>
      <div class="kpi-d dnu">${conSaldo} clientes con saldo</div>
      <div class="kbar"><div class="kfill" style="background:var(--red);width:${Math.min(totPend/totMonto*100,100).toFixed(0)}%"></div></div>
    </div>
    <div class="kpi-card kpi-clickable" style="--ac:var(--orange)" onclick="openPagoModal(null)">
      <div class="kpi-hint">registrar →</div>
      <div class="kpi-top"><div class="kpi-lbl">Pagos Registrados</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">📋</div></div>
      <div class="kpi-val" style="color:var(--orange)">${Object.values(data).flat().length}</div>
      <div class="kpi-d dnu">en este navegador</div>
      <div class="kbar"><div class="kfill" style="background:var(--orange);width:70%"></div></div>
    </div>
  `;

  // Update timestamp
  const upd = document.getElementById('pagos-last-update');
  if (upd) upd.textContent = 'Actualizado: ' + today;

  // Table rows
  tbody.innerHTML = rows.filter(p => p.monto_neto > 0 || p._totalPagado > 0).map((p, i) => {
    const pct = p.monto_neto > 0 ? (p._totalPagado / (p.monto_neto + p.sub_tarjeta + p.sub_bancario) * 100) : 0;
    const est = p._saldo <= 0
      ? '<span class="pill" style="background:var(--green-lt);color:#007a48">✓ Al día</span>'
      : pct > 0
        ? '<span class="pill" style="background:var(--yellow-lt);color:#7a5000">Parcial</span>'
        : '<span class="pill" style="background:var(--red-lt);color:#b02020">Pendiente</span>';
    const histBtn = p._nPagos > 0
      ? `<span style="font-size:.6rem;background:var(--blue-bg);color:var(--blue);border-radius:10px;padding:1px 6px;font-weight:700">${p._nPagos}</span>`
      : '';
    return `<tr>
      <td style="padding:6px 8px;width:28px">
        <button onclick="openHistorial(${p.id})" title="Ver historial" style="background:none;border:none;cursor:pointer;font-size:.8rem;color:var(--muted);padding:2px 4px;border-radius:4px" ${p._nPagos===0?'style="opacity:.35"':''}>🕐${histBtn}</button>
      </td>
      <td class="bld" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.cliente}</td>
      <td class="mo">${fmtTPVFull(p.monto_neto)}</td>
      <td class="mo">${p.sub_tarjeta > 0 ? fmtTPVFull(p.sub_tarjeta) : '<span style="color:var(--muted)">—</span>'}</td>
      <td class="mo">${p.sub_bancario > 0 ? fmtTPVFull(p.sub_bancario) : '<span style="color:var(--muted)">—</span>'}</td>
      <td class="mo pos">${p._totalPagado > 0 ? fmtTPVFull(p._totalPagado) : '<span style="color:var(--muted)">—</span>'}</td>
      <td class="mo ${p._saldo > 0 ? 'neg' : 'pos'}">${p._saldo > 0.01 ? fmtTPVFull(p._saldo) : '<span style="color:var(--green)">✓ $0</span>'}</td>
      <td>${est}</td>
      <td style="text-align:center">
        <button onclick="openPagoModal(${p.id})" style="background:var(--blue);color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:.68rem;font-weight:700;cursor:pointer;font-family:'Figtree',sans-serif">+ Pago</button>
      </td>
    </tr>`;
  }).join('');
}

// ── PAGO MODAL ──
let _pagoClienteId = null;

function openPagoModal(clienteId) {
  _pagoClienteId = clienteId;
  const ov = document.getElementById('pago-overlay');
  ov.style.display = 'flex';

  // Set today's date
  document.getElementById('pago-fecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('pago-monto').value = '';
  document.getElementById('pago-ref').value = '';
  document.getElementById('pago-monto-warn').style.display = 'none';

  // Populate client selector
  const sel = document.getElementById('pago-cliente-sel');
  const wrap = document.getElementById('pago-cliente-wrap');
  sel.innerHTML = '<option value="">— Seleccionar cliente —</option>' +
    TPV_PAGOS.filter(p => p.monto_neto > 0).map(p =>
      `<option value="${p.id}" ${p.id === clienteId ? 'selected' : ''}>${p.cliente}</option>`
    ).join('');

  if (clienteId !== null) {
    const cli = TPV_PAGOS.find(p => p.id === clienteId);
    document.getElementById('pago-modal-cliente-nombre').textContent = cli ? cli.cliente : '';
    wrap.style.display = 'none';
  } else {
    document.getElementById('pago-modal-cliente-nombre').textContent = 'Selecciona el cliente';
    wrap.style.display = '';
  }

  pagoUpdateSaldo();
}

function closePagoModal() {
  document.getElementById('pago-overlay').style.display = 'none';
  _pagoClienteId = null;
}

function pagoUpdateSaldo() {
  const selId = _pagoClienteId || parseInt(document.getElementById('pago-cliente-sel').value);
  const info = document.getElementById('pago-saldo-info');
  if (!selId) { info.style.display = 'none'; return; }
  const cli = TPV_PAGOS.find(p => p.id === selId);
  if (!cli) return;
  const saldo = pagosSaldo(cli);
  document.getElementById('pago-saldo-val').textContent = fmtTPVFull(saldo);
  info.style.display = '';
}

function pagoValidateMonto() {
  const selId = _pagoClienteId || parseInt(document.getElementById('pago-cliente-sel').value);
  const monto = parseFloat(document.getElementById('pago-monto').value) || 0;
  const warn = document.getElementById('pago-monto-warn');
  if (!selId) { warn.style.display = 'none'; return; }
  const cli = TPV_PAGOS.find(p => p.id === selId);
  const saldo = pagosSaldo(cli);
  warn.style.display = (monto > saldo + 0.01) ? '' : 'none';
}

function submitPago() {
  const selId = _pagoClienteId || parseInt(document.getElementById('pago-cliente-sel').value);
  if (!selId) { toast('⚠️ Selecciona un cliente'); return; }

  const fecha  = document.getElementById('pago-fecha').value;
  const monto  = parseFloat(document.getElementById('pago-monto').value);
  const dest   = document.getElementById('pago-destino').value;
  const ref    = document.getElementById('pago-ref').value.trim();

  if (!fecha)      { toast('⚠️ Ingresa la fecha'); return; }
  if (!monto || monto <= 0) { toast('⚠️ Ingresa un monto válido'); return; }

  const data = pagosLoad();
  if (!data[selId]) data[selId] = [];
  data[selId].push({
    id: Date.now(),
    fecha,
    monto,
    destino: dest,
    ref,
    registrado: new Date().toLocaleString('es-MX')
  });
  pagosSave(data);

  const cli = TPV_PAGOS.find(p => p.id === selId);
  toast(`✅ Pago de ${fmtTPVFull(monto)} registrado — ${cli?.cliente || ''}`);
  closePagoModal();
  rTPVPagos();
}

// ── HISTORIAL MODAL ──
function openHistorial(clienteId) {
  const cli = TPV_PAGOS.find(p => p.id === clienteId);
  if (!cli) return;

  const data = pagosLoad();
  const pagos = (data[clienteId] || []).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const totalPagado = pagos.reduce((s, p) => s + p.monto, 0) + cli.total_pagos;
  const saldo = Math.max(0, cli.monto_neto + cli.sub_tarjeta + cli.sub_bancario - totalPagado);

  document.getElementById('hist-title').textContent = '🕐 Historial de Pagos — ' + cli.cliente;
  document.getElementById('hist-subtitle').textContent = `${pagos.length} pago${pagos.length !== 1 ? 's' : ''} registrado${pagos.length !== 1 ? 's' : ''}`;

  document.getElementById('hist-kpis').innerHTML = `
    <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Monto Neto</div><div class="m-kpi-val" style="color:#0073ea">${fmtTPVFull(cli.monto_neto)}</div></div>
    <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Total Pagado</div><div class="m-kpi-val" style="color:var(--green)">${fmtTPVFull(totalPagado)}</div></div>
    <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Saldo Pendiente</div><div class="m-kpi-val" style="color:var(--red)">${fmtTPVFull(saldo)}</div></div>
  `;

  if (pagos.length === 0) {
    document.getElementById('hist-body').innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--muted);font-size:.8rem">
        No hay pagos registrados para este cliente.<br>
        <button class="btn btn-blue" style="margin-top:12px;font-size:.72rem" onclick="closeHistorial();openPagoModal(${clienteId})">+ Registrar primer pago</button>
      </div>`;
  } else {
    document.getElementById('hist-body').innerHTML = `
      <div class="tw" style="margin-bottom:0">
        <div class="tw-h" style="display:flex;align-items:center;justify-content:space-between">
          <div class="tw-ht">Pagos registrados</div>
          <button onclick="deletePagoConfirm=true" style="font-size:.65rem;color:var(--red);background:none;border:none;cursor:pointer">eliminar pago</button>
        </div>
        <table class="bt">
          <thead><tr><th>Fecha</th><th>Destino</th><th class="r">Monto</th><th>Referencia</th><th>Registrado</th><th></th></tr></thead>
          <tbody>
            ${pagos.map(p => `
              <tr>
                <td class="bld">${p.fecha}</td>
                <td><span class="pill" style="${p.destino==='tarjeta'?'background:var(--blue-lt);color:#003d7a':'background:var(--green-lt);color:#007a48'}">${p.destino==='tarjeta'?'💳 Tarjeta':'🏦 Banco'}</span></td>
                <td class="mo pos">${fmtTPVFull(p.monto)}</td>
                <td style="color:var(--muted);font-size:.72rem">${p.ref || '—'}</td>
                <td style="color:var(--muted);font-size:.66rem">${p.registrado}</td>
                <td><button onclick="deletePago(${clienteId},${p.id})" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:.75rem" title="Eliminar">🗑</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  document.getElementById('historial-overlay').style.display = 'flex';
}

function closeHistorial() {
  document.getElementById('historial-overlay').style.display = 'none';
}

function deletePago(clienteId, pagoId) {
  if (!confirm('¿Eliminar este pago?')) return;
  const data = pagosLoad();
  if (data[clienteId]) {
    data[clienteId] = data[clienteId].filter(p => p.id !== pagoId);
    if (data[clienteId].length === 0) delete data[clienteId];
  }
  pagosSave(data);
  toast('🗑 Pago eliminado');
  closeHistorial();
  rTPVPagos();
}

// ── EXPORT CSV ──
function exportPagosCSV() {
  const data = pagosLoad();
  let rows = ['Cliente,Fecha,Monto,Destino,Referencia,Registrado'];
  TPV_PAGOS.forEach(cli => {
    (data[cli.id] || []).forEach(p => {
      rows.push(`"${cli.cliente}","${p.fecha}",${p.monto},"${p.destino==='tarjeta'?'Tarjeta':'Banco'}","${p.ref || ''}","${p.registrado}"`);
    });
  });
  const blob = new Blob([rows.join('\n')], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pagos_tpv_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  toast('📥 CSV descargado');
}



// ==============================
// TARJETAS CHARTS
// ==============================
const TAR_CHARTS = {};

function initTarCharts(view) {
  const isDark = document.body.classList.contains('dark');
  const gc = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const tc = isDark ? '#9da0c5' : '#8b8fb5';
  const colors10 = ['#0073ea','#00b875','#9b51e0','#ff7043','#e53935','#ffa000','#8b8fb5','#17a589','#2e86c1','#aaa'];

  if (view === 'tar_dashboard') {
    // Días bar chart
    if(TAR_CHARTS.dias) TAR_CHARTS.dias.destroy();
    TAR_CHARTS.dias = new Chart(document.getElementById('c-tar-dias'), {
      data: {
        labels: ["Lun", "Mar", "Mi\u00e9", "Jue", "Vie", "S\u00e1b", "Dom"],
        datasets: [
          { type:'bar', label:'Monto ($)', data:[3884834.29, 5126209.37, 2685603.26, 2968260.25, 6093542.11, 3705527.63, 959695.93], backgroundColor:'#0073ea22', borderColor:'#0073ea', borderWidth:1.5, borderRadius:4, yAxisID:'y' },
          { type:'line', label:'Txns', data:[1105, 1159, 866, 677, 1768, 1093, 564], borderColor:'#00b875', backgroundColor:'#00b87520', pointRadius:4, pointBackgroundColor:'#00b875', tension:0.3, yAxisID:'y2' }
        ]
      },
      options: { plugins:{legend:{labels:{font:{size:9},color:tc,boxWidth:10}}}, scales:{
        y:{ grid:{color:gc}, ticks:{color:tc,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':v} },
        y2:{ position:'right', grid:{display:false}, ticks:{color:tc,font:{size:9}} },
        x:{ grid:{display:false}, ticks:{color:tc,font:{size:9}} }
      }}
    });
    // Concepto pie
    if(TAR_CHARTS.conc_pie) TAR_CHARTS.conc_pie.destroy();
    TAR_CHARTS.conc_pie = new Chart(document.getElementById('c-tar-conc-pie'), {
      type:'doughnut',
      data:{ labels:["Compra", "Pago a Tarjeta", "Transferencia", "Retiro ATM", "Rechazada", "Dev. Pago", "Consulta Saldo", "Pago Servicio", "Dev. Transferencia", "Otros"], datasets:[{ data:[3133, 1613, 866, 660, 550, 117, 39, 55, 17, 182], backgroundColor:colors10, borderWidth:0 }] },
      options:{ cutout:'60%', plugins:{ legend:{position:'bottom',labels:{font:{size:8},color:tc,boxWidth:9,padding:6}} } }
    });
    // Top10 bar
    if(TAR_CHARTS.top10) TAR_CHARTS.top10.destroy();
    TAR_CHARTS.top10 = new Chart(document.getElementById('c-tar-top10'), {
      type:'bar',
      data:{ labels:["GRUAS INTERNACIONALE", "-", "Centum Capital", "PIRENTHONS SA DE CV", "WATREL CONSULTORES S", "JUAN MANUEL DE LA CO", "BENJAMIN PAZ PAZ", "CARLEVARO MUEBLERIA", "TEMPLADOS VARSA", "TRINIDAD DESIGNER"], datasets:[{ data:[6165913.09, 5157349.56, 723184.31, 810357.87, 3055899.55, 1886757.42, 245436.06, 781542.29, 967556.58, 0.0], backgroundColor:'#0073ea22', borderColor:'#0073ea', borderWidth:1.5, borderRadius:4 }] },
      options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{
        x:{ grid:{color:gc}, ticks:{color:tc,font:{size:8},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':'$'+v} },
        y:{ grid:{display:false}, ticks:{color:tc,font:{size:8}} }
      }}
    });
    // Rechazos bar
    if(TAR_CHARTS.rec_dash) TAR_CHARTS.rec_dash.destroy();
    TAR_CHARTS.rec_dash = new Chart(document.getElementById('c-tar-rechazos'), {
      type:'bar',
      data:{ labels:["Not sufficient funds", "Bad Track Data", "Over daily limit", "Do not honor", "Exceeds withdrawal limit", "Incorrect PIN", "Otras razones"], datasets:[{ data:[155, 143, 139, 38, 36, 19, 20], backgroundColor:'#e5393522', borderColor:'#e53935', borderWidth:1.5, borderRadius:4 }] },
      options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{
        x:{ grid:{color:gc}, ticks:{color:tc,font:{size:8}} },
        y:{ grid:{display:false}, ticks:{color:tc,font:{size:8}} }
      }}
    });
  }

  if (view === 'tar_conceptos') {
    if(TAR_CHARTS.conc_m) TAR_CHARTS.conc_m.destroy();
    TAR_CHARTS.conc_m = new Chart(document.getElementById('c-tar-conc-monto'), {
      type:'doughnut',
      data:{ labels:["Compra", "Pago a Tarjeta", "Transferencia", "Retiro ATM", "Rechazada", "Dev. Pago", "Consulta Saldo", "Pago Servicio", "Dev. Transferencia", "Otros"], datasets:[{ data:[3962659.12, 12800856.37, 3411209.24, 2668262.57, 1442136.58, 828842.85, 237.22, 4183.0, 65219.57, 240066.32], backgroundColor:colors10, borderWidth:0 }] },
      options:{ cutout:'55%', plugins:{ legend:{position:'right',labels:{font:{size:9},color:tc,boxWidth:10,padding:8}} } }
    });
    if(TAR_CHARTS.conc_t) TAR_CHARTS.conc_t.destroy();
    TAR_CHARTS.conc_t = new Chart(document.getElementById('c-tar-conc-txns'), {
      type:'doughnut',
      data:{ labels:["Compra", "Pago a Tarjeta", "Transferencia", "Retiro ATM", "Rechazada", "Dev. Pago", "Consulta Saldo", "Pago Servicio", "Dev. Transferencia", "Otros"], datasets:[{ data:[3133, 1613, 866, 660, 550, 117, 39, 55, 17, 182], backgroundColor:colors10, borderWidth:0 }] },
      options:{ cutout:'55%', plugins:{ legend:{position:'right',labels:{font:{size:9},color:tc,boxWidth:10,padding:8}} } }
    });
  }

  if (view === 'tar_subclientes') {
    if(TAR_CHARTS.sub_bar) TAR_CHARTS.sub_bar.destroy();
    TAR_CHARTS.sub_bar = new Chart(document.getElementById('c-tar-sub-bar'), {
      type:'bar',
      data:{ labels:["GRUAS INTERNACIONALE", "-", "Centum Capital", "PIRENTHONS SA DE CV", "WATREL CONSULTORES S", "JUAN MANUEL DE LA CO", "BENJAMIN PAZ PAZ", "CARLEVARO MUEBLERIA", "TEMPLADOS VARSA", "TRINIDAD DESIGNER"], datasets:[{ data:[6165913.09, 5157349.56, 723184.31, 810357.87, 3055899.55, 1886757.42, 245436.06, 781542.29, 967556.58, 0.0], backgroundColor:colors10, borderWidth:0, borderRadius:5 }] },
      options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{
        x:{ grid:{color:gc}, ticks:{color:tc,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':'$'+v} },
        y:{ grid:{display:false}, ticks:{color:tc,font:{size:9}} }
      }}
    });
    if(TAR_CHARTS.sub_pie) TAR_CHARTS.sub_pie.destroy();
    TAR_CHARTS.sub_pie = new Chart(document.getElementById('c-tar-sub-pie'), {
      type:'doughnut',
      data:{ labels:["GRUAS INTERNACIONALE", "-", "Centum Capital", "PIRENTHONS SA DE CV", "WATREL CONSULTORES S", "JUAN MANUEL DE LA CO", "BENJAMIN PAZ PAZ", "CARLEVARO MUEBLERIA", "TEMPLADOS VARSA", "TRINIDAD DESIGNER"], datasets:[{ data:[6165913.09, 5157349.56, 723184.31, 810357.87, 3055899.55, 1886757.42, 245436.06, 781542.29, 967556.58, 0.0], backgroundColor:colors10, borderWidth:0 }] },
      options:{ cutout:'55%', plugins:{ legend:{position:'bottom',labels:{font:{size:8},color:tc,boxWidth:9,padding:5}} } }
    });
  }

  if (view === 'tar_rechazos') {
    if(TAR_CHARTS.rec_pie) TAR_CHARTS.rec_pie.destroy();
    TAR_CHARTS.rec_pie = new Chart(document.getElementById('c-tar-rec-pie'), {
      type:'doughnut',
      data:{ labels:["Not sufficient funds", "Bad Track Data", "Over daily limit", "Do not honor", "Exceeds withdrawal limit", "Incorrect PIN", "Otras razones"], datasets:[{ data:[155, 143, 139, 38, 36, 19, 20], backgroundColor:['#e53935','#ff7043','#ffa000','#ffcc02','#aaa','#ccc','#ddd'], borderWidth:0 }] },
      options:{ cutout:'55%', plugins:{ legend:{position:'right',labels:{font:{size:9},color:tc,boxWidth:10,padding:8}} } }
    });
    if(TAR_CHARTS.rec_bar) TAR_CHARTS.rec_bar.destroy();
    TAR_CHARTS.rec_bar = new Chart(document.getElementById('c-tar-rec-bar'), {
      type:'bar',
      data:{ labels:["Not sufficient funds", "Bad Track Data", "Over daily limit", "Do not honor", "Exceeds withdrawal limit", "Incorrect PIN", "Otras razones"], datasets:[{ data:[228805.31, 206415.61, 565761.33, 14607.33, 313110.92, 98966.64, 14469.44], backgroundColor:'#e5393520', borderColor:'#e53935', borderWidth:1.5, borderRadius:4 }] },
      options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{
        x:{ grid:{color:gc}, ticks:{color:tc,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':'$'+v} },
        y:{ grid:{display:false}, ticks:{color:tc,font:{size:9}} }
      }}
    });
  }

  if (view === 'tar_tarjetahabientes') {
    if(TAR_CHARTS.saldos) TAR_CHARTS.saldos.destroy();
    TAR_CHARTS.saldos = new Chart(document.getElementById('c-tar-saldos'), {
      type:'bar',
      data:{ labels:["Negativo (< $0)", "$0.01 - $100", "$100 - $1,000", "$1,000 - $10,000", "$10,000 - $50,000", "> $50,000"], datasets:[{ data:[10772.33, 7317.91, 39395.04, 311254.91, 609993.52, 4248855.99], backgroundColor:['#e5393520','#8b8fb520','#0073ea20','#9b51e020','#00b87520','#ffa00020'], borderColor:['#e53935','#8b8fb5','#0073ea','#9b51e0','#00b875','#ffa000'], borderWidth:1.5, borderRadius:4 }] },
      options:{ plugins:{legend:{display:false}}, scales:{
        x:{ grid:{display:false}, ticks:{color:tc,font:{size:8}} },
        y:{ grid:{color:gc}, ticks:{color:tc,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':'$'+v} }
      }}
    });
  }
}



// ==============================
// CATEGORÍAS P&L — GESTOR
// ==============================
const CAT_CD_DEFAULT = [
  {id:'cd1', nombre:'Nómina Operativa',      tipo:'Nómina',          empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'cd2', nombre:'Software',              tipo:'Operaciones',     empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:5000},
  {id:'cd3', nombre:'Hardware',              tipo:'Operaciones',     empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:10000},
  {id:'cd4', nombre:'Liquidity Providers',   tipo:'Costos Directos', empresas:['Wirebit'], ppto:0},
  {id:'cd5', nombre:'Comisiones Promotoría', tipo:'Com. Bancarias',  empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:13000},
];
const CAT_GA_DEFAULT = [
  {id:'ga1', nombre:'Nómina Administrativa', tipo:'Nómina', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:186000},
  {id:'ga2', nombre:'Renta Oficina', tipo:'Renta', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:36775},
  {id:'ga3', nombre:'Mantenimiento', tipo:'Renta', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:35000},
  {id:'ga4', nombre:'Renta Impresora', tipo:'Administrativo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:2500},
  {id:'ga5', nombre:'Software', tipo:'Operaciones', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:5000},
  {id:'ga6', nombre:'Hardware', tipo:'Operaciones', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:10000},
  {id:'ga7', nombre:'Efevoo Tarjetas', tipo:'Costo Directo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:110000},
  {id:'ga8', nombre:'Efevoo TPV', tipo:'Costo Directo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:100000},
  {id:'ga9', nombre:'Marketing', tipo:'Marketing', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:3000},
  {id:'ga10', nombre:'Luz', tipo:'Administrativo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga11', nombre:'Insumos Oficina', tipo:'Administrativo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:2000},
  {id:'ga12', nombre:'Viáticos', tipo:'Representación', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:10000},
  {id:'ga13', nombre:'Comisiones Bancarias', tipo:'Com. Bancarias', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga14', nombre:'Cumplimiento', tipo:'Regulatorio', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:17391},
];

function catGetData(sec){
  const key = sec==='cd' ? 'vmcr_cat_cd' : 'vmcr_cat_ga';
  const def = sec==='cd' ? CAT_CD_DEFAULT : CAT_GA_DEFAULT;
  try { const s=JSON.parse(localStorage.getItem(key)); return (s&&s.length)?s:JSON.parse(JSON.stringify(def)); }
  catch(e){ return JSON.parse(JSON.stringify(def)); }
}
function catSetData(sec,data){
  localStorage.setItem(sec==='cd'?'vmcr_cat_cd':'vmcr_cat_ga', JSON.stringify(data));
}

let _catTab = 'cd';
let _catEditIdx = null;
let _catEditSec = 'cd';

function rCatView(){
  const cd = catGetData('cd');
  const ga = catGetData('ga');
  const empCols = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
  const allEmps = ['Salem','Endless','Dynamo','Wirebit'];

  function empBadges(empresas){
    return allEmps.map(e => {
      const active = empresas && empresas.includes(e);
      const col = empCols[e];
      return active
        ? '<span style="font-size:.6rem;background:'+col+'22;color:'+col+';padding:2px 6px;border-radius:8px;font-weight:600">'+e+'</span>'
        : '<span style="font-size:.6rem;background:var(--bg);color:var(--muted);padding:2px 6px;border-radius:8px;text-decoration:line-through">'+e+'</span>';
    }).join(' ');
  }

  function buildRows(arr, sec){
    const empList = ['Salem','Endless','Dynamo','Wirebit'];
    const empCols2 = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
    if(!arr.length) return '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">Sin categorías</td></tr>';
    return arr.map((c,i)=>{
      const pp = c.ppto ? '$'+Number(c.ppto).toLocaleString('es-MX') : '—';
      const emps = c.empresas || empList;
      const boxes = empList.map(e=>{
        const col = empCols2[e];
        const chk = emps.includes(e) ? 'checked' : '';
        return '<label style="display:inline-flex;align-items:center;gap:3px;cursor:pointer;padding:3px 7px;border-radius:6px;border:1px solid '+col+'33;background:'+col+'11">'
          +'<input type="checkbox" '+chk+' onchange="catToggleEmp('+i+',\''+sec+'\',\''+e+'\',this.checked)" style="accent-color:'+col+';width:11px;height:11px">'
          +'<span style="font-size:.6rem;font-weight:700;color:'+col+'">'+e.substring(0,3)+'</span>'
          +'</label>';
      }).join('');
      return '<tr id="cat-row-'+sec+'-'+i+'">'
        +'<td style="font-weight:600">'+c.nombre+'</td>'
        +'<td><span style="font-size:.65rem;color:var(--muted);background:var(--bg);padding:2px 7px;border-radius:10px">'+c.tipo+'</span></td>'
        +'<td><div style="display:flex;gap:3px;flex-wrap:wrap">'+boxes+'</div></td>'
        +'<td style="text-align:right">'+pp+'</td>'
        +'<td style="text-align:center;white-space:nowrap">'
          +'<button onclick="catEdit('+i+',\''+sec+'\')" style="background:var(--blue-bg);color:#0073ea;border:none;border-radius:5px;padding:3px 9px;font-size:.65rem;cursor:pointer;margin-right:4px">✏️</button>'
          +'<button onclick="catDel('+i+',\''+sec+'\')" style="background:#fde8e8;color:#c62828;border:none;border-radius:5px;padding:3px 9px;font-size:.65rem;cursor:pointer">🗑</button>'
        +'</td></tr>';
    }).join('');
  }

  // Update KPI exclusivas
  const allCats = cd.concat(ga);
  const kExcl = document.querySelector('#view-cfg_categorias .kpi-val[style*="orange"]');
  if(kExcl) kExcl.textContent = allCats.filter(c=>!c.empresas||c.empresas.length<4).length;

  const tcd = document.getElementById('cat-tbody-cd');
  const tga = document.getElementById('cat-tbody-ga');
  if(tcd) tcd.innerHTML = buildRows(cd,'cd');
  if(tga) tga.innerHTML = buildRows(ga,'ga');
}

function catSwitchTab(tab){
  _catTab = tab;
  const pcd = document.getElementById('catpanel-cd');
  const pga = document.getElementById('catpanel-ga');
  const tcd = document.getElementById('cat-tab-cd');
  const tga = document.getElementById('cat-tab-ga');
  if(pcd) pcd.style.display = tab==='cd' ? '' : 'none';
  if(pga) pga.style.display = tab==='ga' ? '' : 'none';
  if(tcd){ tcd.style.background = tab==='cd' ? '#0073ea' : 'var(--bg)'; tcd.style.color = tab==='cd' ? '#fff' : 'var(--text)'; tcd.style.border = tab==='cd' ? 'none' : '1px solid var(--border)'; }
  if(tga){ tga.style.background = tab==='ga' ? '#0073ea' : 'var(--bg)'; tga.style.color = tab==='ga' ? '#fff' : 'var(--text)'; tga.style.border = tab==='ga' ? 'none' : '1px solid var(--border)'; }
  rCatView();
}

function catNew(){
  catShowModal(null, _catTab);
}

function catEdit(idx, sec){
  catShowModal(idx, sec);
}

function catDel(idx, sec){
  const data = catGetData(sec);
  if(!confirm('¿Eliminar "'+data[idx].nombre+'"?')) return;
  data.splice(idx,1);
  catSetData(sec, data);
  rCatView();
  toast('🗑 Categoría eliminada');
}

function catShowModal(idx, sec){
  _catEditIdx = idx;
  _catEditSec = sec;
  const isNew = idx===null;
  const data  = catGetData(sec);
  const item  = isNew ? {nombre:'',tipo:'',wb_only:false,ppto:0} : data[idx];
  const empList = ['Salem','Endless','Dynamo','Wirebit'];
  const empColors = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0'};
  const curEmps = item.empresas || empList;
  const wbRow = '<div style="margin-bottom:12px"><label class="fl">Aplica a estas empresas</label>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">'
    + empList.map(e => {
        const checked = curEmps.includes(e) ? 'checked' : '';
        const col = empColors[e];
        return '<label style="display:flex;align-items:center;gap:5px;cursor:pointer;padding:4px 10px;border-radius:8px;border:1px solid '+(curEmps.includes(e)?col:'var(--border)')+';background:'+(curEmps.includes(e)?col+'15':'var(--bg)')+';">'
          +'<input type="checkbox" id="cm-emp-'+e+'" '+checked+' style="accent-color:'+col+'">'
          +'<span style="font-size:.72rem;font-weight:600;color:'+(curEmps.includes(e)?col:'var(--muted)')+'">'+e+'</span>'
          +'</label>';
      }).join('')
    +'</div></div>';
  const html =
    '<div style="background:var(--white);border-radius:12px;width:420px;max-width:95vw;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.25)">'
    +'<div style="background:linear-gradient(135deg,#0073ea,#0060c7);padding:16px 22px;display:flex;align-items:center;justify-content:space-between">'
      +'<div style="font-family:Poppins,sans-serif;font-weight:700;color:#fff;font-size:.9rem">'+(isNew?'+ Nueva Categoría':'✏️ Editar Categoría')+'</div>'
      +'<button onclick="document.getElementById(\'confirm-overlay\').style.display=\'none\'" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:28px;height:28px;border-radius:7px;cursor:pointer;font-size:.9rem">✕</button>'
    +'</div>'
    +'<div style="padding:20px 22px">'
      +'<div style="margin-bottom:12px"><label class="fl">Nombre</label>'
        +'<input type="text" id="cm-nombre" class="fi" value="'+item.nombre+'" placeholder="Ej: Comisiones Promotoría"></div>'
      +'<div style="margin-bottom:12px"><label class="fl">Tipo / Agrupación</label>'
        +'<input type="text" id="cm-tipo" class="fi" value="'+item.tipo+'" placeholder="Ej: Nómina, Operaciones..."></div>'
      +'<div style="margin-bottom:12px"><label class="fl">Presupuesto Mensual ($)</label>'
        +'<input type="number" id="cm-ppto" class="fi n" value="'+(item.ppto||0)+'" min="0"></div>'
      + wbRow
      +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">'
        +'<button onclick="document.getElementById(\'confirm-overlay\').style.display=\'none\'" class="btn btn-out">Cancelar</button>'
        +'<button onclick="catSaveModal()" style="background:#0073ea;color:#fff;border:none;border-radius:8px;padding:7px 16px;font-size:.8rem;font-weight:600;cursor:pointer">✅ Guardar</button>'
      +'</div>'
    +'</div>'
  +'</div>';
  const ov = document.getElementById('confirm-overlay');
  ov.style.display = 'flex';
  ov.innerHTML = html;
}

function catSaveModal(){
  const nombre = document.getElementById('cm-nombre').value.trim();
  const tipo   = document.getElementById('cm-tipo').value.trim();
  const ppto   = parseFloat(document.getElementById('cm-ppto').value)||0;
  const empList2 = ['Salem','Endless','Dynamo','Wirebit'];
  const empresas = empList2.filter(e => { const el=document.getElementById('cm-emp-'+e); return el&&el.checked; });
  if(!nombre){ toast('⚠️ Ingresa el nombre'); return; }
  if(!empresas.length){ toast('⚠️ Selecciona al menos una empresa'); return; }
  const data = catGetData(_catEditSec);
  if(_catEditIdx===null){
    data.push({id:_catEditSec+'_'+Date.now(), nombre, tipo, empresas, ppto});
    toast('✅ Categoría "'+nombre+'" agregada');
  } else {
    data[_catEditIdx] = {...data[_catEditIdx], nombre, tipo, empresas, ppto};
    toast('✅ Categoría "'+nombre+'" actualizada');
  }
  catSetData(_catEditSec, data);
  document.getElementById('confirm-overlay').style.display='none';
  rCatView();
}


function catToggleEmp(idx, sec, empresa, checked){
  const data = catGetData(sec);
  if(!data[idx]) return;
  let emps = data[idx].empresas ? [...data[idx].empresas] : ['Salem','Endless','Dynamo','Wirebit'];
  if(checked && !emps.includes(empresa)) emps.push(empresa);
  if(!checked)  emps = emps.filter(e => e !== empresa);
  if(!emps.length){ 
    toast('⚠️ Debe quedar al menos una empresa'); 
    // Revert checkbox
    const cb = document.querySelector('#cat-row-'+sec+'-'+idx+' input[onchange*=\''+empresa+'\']');
    if(cb) cb.checked = true;
    return; 
  }
  data[idx].empresas = emps;
  catSetData(sec, data);
  // Update KPI exclusivas
  const allCD = catGetData('cd');
  const allGA = catGetData('ga');
  const excl = [...allCD,...allGA].filter(c=>!c.empresas||c.empresas.length<4).length;
  const kex = document.getElementById('cat-kpi-excl');
  if(kex) kex.textContent = excl;
  toast('✅ Guardado');
}


// ══════════════════════════════════════
