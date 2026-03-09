// GF — Terminales TPV

// TPV DATA + RENDER FUNCTIONS
// ═══════════════════════════════════════
const TPV_DG_CLIENTS  = [{"id": 12, "cliente": "C Cumbres", "monto_tc": 4874020.5, "monto_td": 9152306.850000001, "monto_amex": 32501, "total": 14058828.350000001}, {"id": 84, "cliente": "La Churrasca Atlixco", "monto_tc": 1010453.8799999997, "monto_td": 1060268.0799999998, "monto_amex": 201614.42, "total": 2272336.3799999994}, {"id": 137, "cliente": "Del Valle", "monto_tc": 471802, "monto_td": 811338, "monto_amex": 118705, "total": 1401845}, {"id": 83, "cliente": "La Cantada", "monto_tc": 597765.2000000001, "monto_td": 672681.44, "monto_amex": 51877.75, "total": 1322324.3900000001}, {"id": 147, "cliente": "Lucia Acapulco", "monto_tc": 450227.16, "monto_td": 582211.7599999999, "monto_amex": 18540, "total": 1050978.92}, {"id": 123, "cliente": "TONYS RESTAURANTE", "monto_tc": 582443.75, "monto_td": 377478.45, "monto_amex": 17080.25, "total": 977002.45}, {"id": 142, "cliente": "Flamingos Palace", "monto_tc": 250476, "monto_td": 657897, "monto_amex": 0, "total": 908373}, {"id": 14, "cliente": "Carlevaro Muebleria", "monto_tc": 411595.3900000001, "monto_td": 368325, "monto_amex": 40275, "total": 820195.3900000001}, {"id": 98, "cliente": "Norday Termos", "monto_tc": 246581.55, "monto_td": 268187.41000000003, "monto_amex": 38430, "total": 553198.96}, {"id": 40, "cliente": "ECYQ Medical Benefits", "monto_tc": 543863, "monto_td": 0, "monto_amex": 0, "total": 543863}, {"id": 111, "cliente": "RAMIREZ Y RAMIREZ", "monto_tc": 343400, "monto_td": 65760, "monto_amex": 43000, "total": 452160}, {"id": 91, "cliente": "Mato Grosso", "monto_tc": 196635.79999999996, "monto_td": 212147.61, "monto_amex": 3479.16, "total": 412262.5699999999}, {"id": 143, "cliente": "Focaccia", "monto_tc": 144735, "monto_td": 249445.5, "monto_amex": 10515, "total": 404695.5}, {"id": 125, "cliente": "Topolino", "monto_tc": 153994.2, "monto_td": 206972.9100000002, "monto_amex": 5498.45, "total": 366465.56000000023}, {"id": 124, "cliente": "Top Tent Outlet", "monto_tc": 233576.59999999998, "monto_td": 118492.3, "monto_amex": 0, "total": 352068.89999999997}, {"id": 128, "cliente": "UrbanOutled", "monto_tc": 138966.3, "monto_td": 205108.23, "monto_amex": 1, "total": 344075.53}, {"id": 86, "cliente": "LA CUPULA", "monto_tc": 141115.5, "monto_td": 164113.1, "monto_amex": 5305.5, "total": 310534.1}, {"id": 72, "cliente": "HE", "monto_tc": 134002.70000000004, "monto_td": 152670.43000000005, "monto_amex": 6540.099999999999, "total": 293213.2300000001}, {"id": 5, "cliente": "AMOBA", "monto_tc": 136180.55, "monto_td": 141729.85, "monto_amex": 2184.5, "total": 280094.9}, {"id": 85, "cliente": "La Crianza", "monto_tc": 152491.02, "monto_td": 122156.44, "monto_amex": 2873.05, "total": 277520.50999999995}, {"id": 55, "cliente": "Empire Fitness Lomas de Angelopolis", "monto_tc": 147098, "monto_td": 126297, "monto_amex": 0, "total": 273395}, {"id": 120, "cliente": "Tintoreria Easy Clean", "monto_tc": 144910, "monto_td": 111470, "monto_amex": 10838, "total": 267218}, {"id": 45, "cliente": "Empire Fitness Cholula", "monto_tc": 118263, "monto_td": 130934, "monto_amex": 0, "total": 249197}, {"id": 61, "cliente": "Empire Fitness Torres Medicas", "monto_tc": 106598, "monto_td": 141096, "monto_amex": 0, "total": 247694}, {"id": 95, "cliente": "Molienda Sagrada", "monto_tc": 121126.01000000002, "monto_td": 111792.81999999996, "monto_amex": 7427.100000000001, "total": 240345.93}, {"id": 48, "cliente": "Empire Fitness Estambres", "monto_tc": 110620, "monto_td": 115210, "monto_amex": 1912, "total": 227742}, {"id": 139, "cliente": "Dentista Ninos", "monto_tc": 135120, "monto_td": 90240, "monto_amex": 1350, "total": 226710}, {"id": 24, "cliente": "CONSULTORIO MEDICO DR DAVID FIGUEROA", "monto_tc": 119500, "monto_td": 77000, "monto_amex": 22400, "total": 218900}, {"id": 35, "cliente": "DR JUAN DE DIOS QUIROZ", "monto_tc": 94316, "monto_td": 90685, "monto_amex": 27260, "total": 212261}, {"id": 20, "cliente": "Club PH Phonique", "monto_tc": 108529.2, "monto_td": 69829.76000000001, "monto_amex": 28832.649999999998, "total": 207191.61000000002}, {"id": 27, "cliente": "Dabuten", "monto_tc": 100033.34999999999, "monto_td": 90989.12999999999, "monto_amex": 15589.33, "total": 206611.80999999997}, {"id": 117, "cliente": "Siembra Comedor", "monto_tc": 120252.85, "monto_td": 85568.6, "monto_amex": 0, "total": 205821.45}, {"id": 69, "cliente": "Funky Mama", "monto_tc": 84768.25, "monto_td": 103582.69999999998, "monto_amex": 7274.5, "total": 195625.44999999998}, {"id": 60, "cliente": "Empire Fitness Tlaxcala", "monto_tc": 60223, "monto_td": 116209, "monto_amex": 0, "total": 176432}, {"id": 78, "cliente": "HU", "monto_tc": 83530.44999999998, "monto_td": 85165.66999999997, "monto_amex": 5177.049999999999, "total": 173873.16999999993}, {"id": 53, "cliente": "Empire Fitness Heroes", "monto_tc": 78233, "monto_td": 90784, "monto_amex": 3668, "total": 172685}, {"id": 46, "cliente": "Empire Fitness Cienega", "monto_tc": 49272, "monto_td": 115202, "monto_amex": 0, "total": 164474}, {"id": 70, "cliente": "Grupo Vitalis", "monto_tc": 84590, "monto_td": 66625.04000000001, "monto_amex": 11210, "total": 162425.04}, {"id": 41, "cliente": "Eleven People", "monto_tc": 46959.5, "monto_td": 28263.3, "monto_amex": 83136, "total": 158358.8}, {"id": 89, "cliente": "Luna Canela", "monto_tc": 55760.94, "monto_td": 67674.29000000001, "monto_amex": 27509, "total": 150944.23}, {"id": 42, "cliente": "Empire Fitness 31 PTE", "monto_tc": 75623, "monto_td": 67704, "monto_amex": 479, "total": 143806}, {"id": 54, "cliente": "Empire Fitness Las Torres", "monto_tc": 57183, "monto_td": 81868.9, "monto_amex": 0, "total": 139051.9}, {"id": 62, "cliente": "Empire Fitness Vive la Cienega", "monto_tc": 54110, "monto_td": 84886, "monto_amex": 0, "total": 138996}, {"id": 100, "cliente": "NUTRIMET CUAUTLANCINGO", "monto_tc": 40752.2, "monto_td": 89823, "monto_amex": 0, "total": 130575.2}, {"id": 36, "cliente": "Dr Juan Domingo Porras", "monto_tc": 61400, "monto_td": 55500, "monto_amex": 13500, "total": 130400}, {"id": 19, "cliente": "Clinica Dental Sonrie", "monto_tc": 68075, "monto_td": 60625, "monto_amex": 0, "total": 128700}, {"id": 126, "cliente": "Trinidad Designer", "monto_tc": 41800, "monto_td": 86595, "monto_amex": 0, "total": 128395}, {"id": 59, "cliente": "Empire Fitness Tlahuac", "monto_tc": 70432, "monto_td": 56291, "monto_amex": 0, "total": 126723}, {"id": 49, "cliente": "Empire Fitness Finsa", "monto_tc": 48457, "monto_td": 73949, "monto_amex": 0, "total": 122406}, {"id": 8, "cliente": "Bar 7", "monto_tc": 56900, "monto_td": 13000, "monto_amex": 49500, "total": 119400}, {"id": 51, "cliente": "Empire Fitness Galerias Serdan CH", "monto_tc": 37155, "monto_td": 77304, "monto_amex": 0, "total": 114459}, {"id": 93, "cliente": "Mexico Handmade", "monto_tc": 109635, "monto_td": 0, "monto_amex": 4536, "total": 114171}, {"id": 76, "cliente": "HP", "monto_tc": 43527, "monto_td": 66259, "monto_amex": 0, "total": 109786}, {"id": 7, "cliente": "Arko Payment Solutions", "monto_tc": 54401.5, "monto_td": 50745.15, "monto_amex": 4078.25, "total": 109224.9}, {"id": 22, "cliente": "Constructora Brumo", "monto_tc": 105316, "monto_td": 0, "monto_amex": 1100, "total": 106416}, {"id": 121, "cliente": "Todo Corazon", "monto_tc": 40608.5, "monto_td": 25236, "monto_amex": 36505, "total": 102349.5}, {"id": 13, "cliente": "CACHITO LINDO Y QUERIDO", "monto_tc": 38640.5, "monto_td": 54723.85, "monto_amex": 0, "total": 93364.35}, {"id": 113, "cliente": "Rodane", "monto_tc": 40585.25, "monto_td": 50135.130000000005, "monto_amex": 0, "total": 90720.38}, {"id": 71, "cliente": "Hacienda Soleil", "monto_tc": 51819.74999999999, "monto_td": 32909.799999999996, "monto_amex": 5930.24, "total": 90659.79}, {"id": 148, "cliente": "Mayan Art", "monto_tc": 0, "monto_td": 0, "monto_amex": 88771, "total": 88771}, {"id": 44, "cliente": "Empire Fitness Centro Historico", "monto_tc": 40587, "monto_td": 47964, "monto_amex": 0, "total": 88551}, {"id": 37, "cliente": "DR RODRIGO MONROY CARVAJAL", "monto_tc": 53100, "monto_td": 35200, "monto_amex": 0, "total": 88300}, {"id": 2, "cliente": "ADICTO CAFE LA MINERVA", "monto_tc": 34888.79, "monto_td": 52268.00999999998, "monto_amex": 640, "total": 87796.79999999999}, {"id": 34, "cliente": "DR JORGE GARCIA RENTERIA", "monto_tc": 27194, "monto_td": 60597, "monto_amex": 0, "total": 87791}, {"id": 116, "cliente": "Servicios Medicos Integrales", "monto_tc": 70885.98, "monto_td": 15160.240000000002, "monto_amex": 0, "total": 86046.22}, {"id": 52, "cliente": "Empire Fitness Guadalajara", "monto_tc": 60127, "monto_td": 21097, "monto_amex": 4484, "total": 85708}, {"id": 56, "cliente": "Empire Fitness Mirador 1", "monto_tc": 38688, "monto_td": 46101, "monto_amex": 479, "total": 85268}, {"id": 74, "cliente": "Hostess 4G", "monto_tc": 85000, "monto_td": 0, "monto_amex": 0, "total": 85000}, {"id": 97, "cliente": "MT Mechanics", "monto_tc": 49810.020000000004, "monto_td": 25759, "monto_amex": 0, "total": 75569.02}, {"id": 118, "cliente": "Super el Valle", "monto_tc": 12916, "monto_td": 61379, "monto_amex": 0, "total": 74295}, {"id": 127, "cliente": "UNIDAD DE ESPECIALIDADES ORTOPEDICAS", "monto_tc": 24200, "monto_td": 46400, "monto_amex": 2500, "total": 73100}, {"id": 26, "cliente": "CR Alimentos", "monto_tc": 23246.75, "monto_td": 44286.75, "monto_amex": 3680, "total": 71213.5}, {"id": 135, "cliente": "Yacht Cancun", "monto_tc": 0, "monto_td": 3.0299999999999994, "monto_amex": 71150.1, "total": 71153.13}, {"id": 57, "cliente": "Empire Fitness Mirador 2", "monto_tc": 41328, "monto_td": 29356, "monto_amex": 0, "total": 70684}, {"id": 145, "cliente": "Focca 2", "monto_tc": 29610.610000000008, "monto_td": 31546.500000000004, "monto_amex": 3477.6, "total": 64634.710000000014}, {"id": 119, "cliente": "Templados Varsa", "monto_tc": 7826.900000000001, "monto_td": 54423.52, "monto_amex": 0, "total": 62250.42}, {"id": 87, "cliente": "La ruta de las Indias", "monto_tc": 17155, "monto_td": 42310, "monto_amex": 1800, "total": 61265}, {"id": 15, "cliente": "Casa Mexicana", "monto_tc": 14010, "monto_td": 1.01, "monto_amex": 46075, "total": 60086.01}, {"id": 141, "cliente": "Ecoden", "monto_tc": 14000, "monto_td": 43200, "monto_amex": 0, "total": 57200}, {"id": 50, "cliente": "Empire Fitness Fortuna", "monto_tc": 27470, "monto_td": 29667, "monto_amex": 0, "total": 57137}, {"id": 47, "cliente": "Empire Fitness Ecatepec", "monto_tc": 20979, "monto_td": 35501, "monto_amex": 50, "total": 56530}, {"id": 11, "cliente": "Box Box Car Service", "monto_tc": 45108.42, "monto_td": 7719.01, "monto_amex": 2250, "total": 55077.43}, {"id": 31, "cliente": "DR FRANCISCO JAVIER ", "monto_tc": 28110, "monto_td": 26255, "monto_amex": 0, "total": 54365}, {"id": 101, "cliente": "NUTRISIM", "monto_tc": 26179.33, "monto_td": 25634, "monto_amex": 921, "total": 52734.33}, {"id": 23, "cliente": "Consulta Medica DU", "monto_tc": 30200, "monto_td": 20701, "monto_amex": 1200, "total": 52101}, {"id": 104, "cliente": "Padel World", "monto_tc": 19100, "monto_td": 16085, "monto_amex": 12360, "total": 47545}, {"id": 159, "cliente": "TGRS", "monto_tc": 18748.829999999998, "monto_td": 26618.059999999994, "monto_amex": 1575.6, "total": 46942.48999999999}, {"id": 79, "cliente": "INSTITUTO PANAMERICANO DEL CORAZON", "monto_tc": 14600, "monto_td": 28300, "monto_amex": 0, "total": 42900}, {"id": 68, "cliente": "Freshify", "monto_tc": 13639.609999999999, "monto_td": 15458.97, "monto_amex": 10919.57, "total": 40018.149999999994}, {"id": 30, "cliente": "DR FERNANDO ZARAIN", "monto_tc": 14600, "monto_td": 22500, "monto_amex": 1000, "total": 38100}, {"id": 43, "cliente": "Empire Fitness Acocota", "monto_tc": 22360, "monto_td": 11429, "monto_amex": 0, "total": 33789}, {"id": 136, "cliente": "Convenia Links de Pago", "monto_tc": 33000, "monto_td": 0, "monto_amex": 0, "total": 33000}, {"id": 94, "cliente": "MJ", "monto_tc": 12250, "monto_td": 19910.01, "monto_amex": 0, "total": 32160.01}, {"id": 32, "cliente": "DR GERARDO CASTORENA ROJI", "monto_tc": 18000, "monto_td": 14000, "monto_amex": 0, "total": 32000}, {"id": 110, "cliente": "Quesos Chiapas 2", "monto_tc": 11983, "monto_td": 12707.9, "monto_amex": 5299.51, "total": 29990.410000000003}, {"id": 133, "cliente": "Why Wait", "monto_tc": 7800, "monto_td": 5000, "monto_amex": 16360, "total": 29160}, {"id": 77, "cliente": "HS", "monto_tc": 11185, "monto_td": 17553, "monto_amex": 0, "total": 28738}, {"id": 115, "cliente": "Santuario Pio", "monto_tc": 12380, "monto_td": 15020, "monto_amex": 0, "total": 27400}, {"id": 38, "cliente": "DUMEDIC", "monto_tc": 4487, "monto_td": 0, "monto_amex": 21841, "total": 26328}, {"id": 58, "cliente": "Empire Fitness San Martin", "monto_tc": 8328, "monto_td": 16423, "monto_amex": 0, "total": 24751}, {"id": 63, "cliente": "Fededome", "monto_tc": 11984, "monto_td": 10484, "monto_amex": 0, "total": 22468}, {"id": 96, "cliente": "Montajes Operativos", "monto_tc": 2844, "monto_td": 18416.22, "monto_amex": 0, "total": 21260.22}, {"id": 132, "cliente": "Wallfine", "monto_tc": 19188.15, "monto_td": 155, "monto_amex": 0, "total": 19343.15}, {"id": 29, "cliente": "DR FELIX URBINA", "monto_tc": 8900, "monto_td": 9400, "monto_amex": 0, "total": 18300}, {"id": 151, "cliente": "Camca Automotriz", "monto_tc": 17400, "monto_td": 0, "monto_amex": 0, "total": 17400}, {"id": 146, "cliente": "Iglesia Cristiana", "monto_tc": 2975, "monto_td": 9030, "monto_amex": 0, "total": 12005}, {"id": 33, "cliente": "DR JESUS PONCE ONCOPEDIA", "monto_tc": 2500, "monto_td": 8800, "monto_amex": 0, "total": 11300}, {"id": 109, "cliente": "Quesos Chiapas", "monto_tc": 1190, "monto_td": 8472, "monto_amex": 0, "total": 9662}, {"id": 80, "cliente": "Joyeria Zafiro", "monto_tc": 0, "monto_td": 0, "monto_amex": 8675, "total": 8675}, {"id": 90, "cliente": "Manik Odontologia", "monto_tc": 4900, "monto_td": 3650, "monto_amex": 5, "total": 8555}, {"id": 66, "cliente": "Frans Automotive", "monto_tc": 2000, "monto_td": 6510, "monto_amex": 0, "total": 8510}, {"id": 129, "cliente": "UROLOGIA FUNCIONAL", "monto_tc": 4500, "monto_td": 3600, "monto_amex": 0, "total": 8100}, {"id": 6, "cliente": "Antojo Gula", "monto_tc": 3746.5, "monto_td": 3876.8, "monto_amex": 350, "total": 7973.3}, {"id": 3, "cliente": "Ajedrez", "monto_tc": 3590, "monto_td": 3590, "monto_amex": 0, "total": 7180}, {"id": 108, "cliente": "Potato Shop", "monto_tc": 7000, "monto_td": 0, "monto_amex": 0, "total": 7000}, {"id": 138, "cliente": "Dentalyss Center", "monto_tc": 6500, "monto_td": 0, "monto_amex": 0, "total": 6500}, {"id": 106, "cliente": "Playa Kaleta Restaurante", "monto_tc": 678.5, "monto_td": 5762.200000000001, "monto_amex": 0, "total": 6440.700000000001}, {"id": 149, "cliente": "Nutriment 11 Sur", "monto_tc": 4815, "monto_td": 1399, "monto_amex": 0, "total": 6214}, {"id": 156, "cliente": "Los Amigos", "monto_tc": 2212.1300000000006, "monto_td": 3997.8, "monto_amex": 0, "total": 6209.93}, {"id": 9, "cliente": "Bar La Oficina", "monto_tc": 485, "monto_td": 4456, "monto_amex": 759, "total": 5700}, {"id": 140, "cliente": "Dr Rogelio Herrera Lima", "monto_tc": 0, "monto_td": 5000, "monto_amex": 0, "total": 5000}, {"id": 103, "cliente": "OTORRINO LOMAS", "monto_tc": 4930, "monto_td": 0, "monto_amex": 0, "total": 4930}, {"id": 10, "cliente": "Blackhawk", "monto_tc": 2430, "monto_td": 1610, "monto_amex": 580, "total": 4620}, {"id": 154, "cliente": "HD", "monto_tc": 1940.02, "monto_td": 2060.04, "monto_amex": 0, "total": 4000.06}, {"id": 75, "cliente": "Hotel Casa Real", "monto_tc": 625, "monto_td": 3345, "monto_amex": 0, "total": 3970}, {"id": 155, "cliente": "La Ruta De Las Indias SF", "monto_tc": 0, "monto_td": 1850, "monto_amex": 0, "total": 1850}, {"id": 102, "cliente": "Onoloa Poke House", "monto_tc": 1608, "monto_td": 236.5, "monto_amex": 0, "total": 1844.5}, {"id": 152, "cliente": "Corte Gaucho", "monto_tc": 1840, "monto_td": 0, "monto_amex": 0, "total": 1840}, {"id": 105, "cliente": "PadelMatch", "monto_tc": 1225, "monto_td": 55, "monto_amex": 0, "total": 1280}, {"id": 158, "cliente": "RAWPAW", "monto_tc": 856, "monto_td": 0, "monto_amex": 0, "total": 856}, {"id": 67, "cliente": "Fresh Solutions", "monto_tc": 0, "monto_td": 500, "monto_amex": 0, "total": 500}, {"id": 21, "cliente": "Cocina Montejo", "monto_tc": 250, "monto_td": 202, "monto_amex": 0, "total": 452}, {"id": 82, "cliente": "LA CALLE", "monto_tc": 0, "monto_td": 0, "monto_amex": 280, "total": 280}, {"id": 64, "cliente": "Ferba Sports", "monto_tc": 0, "monto_td": 50, "monto_amex": 0, "total": 50}, {"id": 1, "cliente": "7 Cielos", "monto_tc": 10, "monto_td": 20, "monto_amex": 0, "total": 30}, {"id": 130, "cliente": "Viajes CEUNI", "monto_tc": 11, "monto_td": 0, "monto_amex": 10, "total": 21}, {"id": 112, "cliente": "Rest B", "monto_tc": 10, "monto_td": 0, "monto_amex": 10, "total": 20}, {"id": 4, "cliente": "Amo Tulum Tours", "monto_tc": 0, "monto_td": 11, "monto_amex": 0, "total": 11}, {"id": 17, "cliente": "CENTUM CABO", "monto_tc": 11, "monto_td": 0, "monto_amex": 0, "total": 11}, {"id": 157, "cliente": "Obsidiana", "monto_tc": 10, "monto_td": 0, "monto_amex": 0, "total": 10}, {"id": 18, "cliente": "CENTUM CAPITAL", "monto_tc": 3.1, "monto_td": 0, "monto_amex": 0, "total": 3.1}, {"id": 122, "cliente": "Tony2", "monto_tc": 0, "monto_td": 0.01, "monto_amex": 1.1, "total": 1.11}, {"id": 107, "cliente": "Poch del Huach Centro", "monto_tc": 0, "monto_td": 1, "monto_amex": 0, "total": 1}, {"id": 114, "cliente": "Santo Chancho", "monto_tc": 1, "monto_td": 0, "monto_amex": 0, "total": 1}, {"id": 134, "cliente": "Wicho", "monto_tc": 1, "monto_td": 0, "monto_amex": 0, "total": 1}, {"id": 144, "cliente": "Focca", "monto_tc": 1, "monto_td": 0, "monto_amex": 0, "total": 1}, {"id": 81, "cliente": "Jpart", "monto_tc": 0.02, "monto_td": 0, "monto_amex": 0, "total": 0.02}, {"id": 16, "cliente": "Centro Joyero Centenario", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 25, "cliente": "Convenia Link de Pago", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 28, "cliente": "Dentista de Niños", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 39, "cliente": "ECODEM", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 65, "cliente": "Foccacia", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 73, "cliente": "HLT Services", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 88, "cliente": "Lucia Aca", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 92, "cliente": "Mayan Arts", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 99, "cliente": "Nutrimet 11 Sur", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 131, "cliente": "VIP del Valle", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 150, "cliente": "Arq Alejandro Jimenez", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 153, "cliente": "DupratDr", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}];
const TPV_D_CLIENTS   = [{"id": 12, "cliente": "C CUMBRES", "monto_tc": 2733836.6500000004, "monto_td": 5552448.75, "monto_amex": 27060, "total": 8313345.4}, {"id": 84, "cliente": "La Churrasca Atlixco", "monto_tc": 976008.3799999998, "monto_td": 1019637.8799999998, "monto_amex": 176869.42, "total": 2172515.6799999997}, {"id": 138, "cliente": "Del Valle", "monto_tc": 471802, "monto_td": 811338, "monto_amex": 118705, "total": 1401845}, {"id": 148, "cliente": "Lucia Acapulco", "monto_tc": 389990.16, "monto_td": 474569.7599999999, "monto_amex": 6540, "total": 871099.9199999999}, {"id": 83, "cliente": "LA CANTADA", "monto_tc": 370000.9, "monto_td": 413161.9100000001, "monto_amex": 38426.25, "total": 821589.06}, {"id": 14, "cliente": "Carlevaro Muebleria", "monto_tc": 399195.38000000006, "monto_td": 216275, "monto_amex": 40275, "total": 655745.3800000001}, {"id": 123, "cliente": "Tonys Restaurante", "monto_tc": 365640.5, "monto_td": 226805.2, "monto_amex": 15269, "total": 607714.7}, {"id": 40, "cliente": "ECyQ Medical Benefits", "monto_tc": 543863, "monto_td": 0, "monto_amex": 0, "total": 543863}, {"id": 91, "cliente": "Mato Grosso", "monto_tc": 196635.79999999996, "monto_td": 212147.61, "monto_amex": 3479.16, "total": 412262.5699999999}, {"id": 144, "cliente": "Focaccia", "monto_tc": 144735, "monto_td": 249445.5, "monto_amex": 10515, "total": 404695.5}, {"id": 98, "cliente": "NORDAY Termos", "monto_tc": 151136.05, "monto_td": 156583.8, "monto_amex": 26720, "total": 334439.85}, {"id": 128, "cliente": "UrbanOutled", "monto_tc": 116658.3, "monto_td": 155727.93000000002, "monto_amex": 1, "total": 272387.23000000004}, {"id": 55, "cliente": "Empire Fitness Lomas de Angelopolis", "monto_tc": 140844, "monto_td": 120929, "monto_amex": 0, "total": 261773}, {"id": 111, "cliente": "RAMIREZ Y RAMIREZ", "monto_tc": 188600, "monto_td": 46500, "monto_amex": 20000, "total": 255100}, {"id": 86, "cliente": "LA CUPULA", "monto_tc": 112145.25, "monto_td": 135070.1, "monto_amex": 4523.5, "total": 251738.85}, {"id": 124, "cliente": "TOP TENT OUTLET", "monto_tc": 144764.59999999998, "monto_td": 95790, "monto_amex": 0, "total": 240554.59999999998}, {"id": 45, "cliente": "Empire Fitness Cholula", "monto_tc": 112863, "monto_td": 116308, "monto_amex": 0, "total": 229171}, {"id": 61, "cliente": "Empire Fitness Torres Medicas", "monto_tc": 91608, "monto_td": 130317, "monto_amex": 0, "total": 221925}, {"id": 48, "cliente": "Empire Fitness Estambres", "monto_tc": 102788, "monto_td": 108838, "monto_amex": 1912, "total": 213538}, {"id": 20, "cliente": "Club PH Phonique", "monto_tc": 108529.2, "monto_td": 69829.76000000001, "monto_amex": 28832.649999999998, "total": 207191.61000000002}, {"id": 85, "cliente": "LA CRIANZA", "monto_tc": 114883.85, "monto_td": 85392.7, "monto_amex": 1749, "total": 202025.55}, {"id": 120, "cliente": "Tintoreria Easy Clean", "monto_tc": 108247, "monto_td": 79228, "monto_amex": 8512, "total": 195987}, {"id": 5, "cliente": "AMOBA", "monto_tc": 94987.8, "monto_td": 93420.5, "monto_amex": 10, "total": 188418.3}, {"id": 72, "cliente": "HE", "monto_tc": 75961.54000000001, "monto_td": 97979.06, "monto_amex": 5121.9, "total": 179062.5}, {"id": 117, "cliente": "SIEMBRA COMEDOR", "monto_tc": 98913.35, "monto_td": 76266.6, "monto_amex": 0, "total": 175179.95}, {"id": 95, "cliente": "MOLIENDA SAGRADA", "monto_tc": 87287.32000000002, "monto_td": 80457.02, "monto_amex": 3586.65, "total": 171330.99000000002}, {"id": 53, "cliente": "Empire Fitness Heroes", "monto_tc": 70783, "monto_td": 88181, "monto_amex": 3668, "total": 162632}, {"id": 125, "cliente": "Topolino", "monto_tc": 69370, "monto_td": 90373.06000000001, "monto_amex": 0, "total": 159743.06}, {"id": 140, "cliente": "Dentista Ninos", "monto_tc": 98240, "monto_td": 56970, "monto_amex": 1350, "total": 156560}, {"id": 60, "cliente": "Empire Fitness Tlaxcala", "monto_tc": 45061, "monto_td": 106929, "monto_amex": 0, "total": 151990}, {"id": 35, "cliente": "DR JUAN DE DIOS QUIROZ", "monto_tc": 71130, "monto_td": 58785, "monto_amex": 15215, "total": 145130}, {"id": 24, "cliente": "CONSULTORIO MEDICO DR DAVID FIGUEROA", "monto_tc": 70000, "monto_td": 62800, "monto_amex": 11900, "total": 144700}, {"id": 69, "cliente": "Funky Mama", "monto_tc": 64977.75, "monto_td": 72484.69999999998, "monto_amex": 3299, "total": 140761.44999999998}, {"id": 46, "cliente": "Empire Fitness Cienega", "monto_tc": 40590, "monto_td": 97556, "monto_amex": 0, "total": 138146}, {"id": 42, "cliente": "Empire Fitness 31 PTE", "monto_tc": 68788, "monto_td": 61489, "monto_amex": 479, "total": 130756}, {"id": 27, "cliente": "DABUTEN", "monto_tc": 61882.17999999999, "monto_td": 52152.73, "monto_amex": 8533.849999999999, "total": 122568.76000000001}, {"id": 54, "cliente": "Empire Fitness Las Torres", "monto_tc": 47506, "monto_td": 73437.9, "monto_amex": 0, "total": 120943.9}, {"id": 62, "cliente": "Empire Fitness Vive la Cienega", "monto_tc": 46339, "monto_td": 74399, "monto_amex": 0, "total": 120738}, {"id": 126, "cliente": "Trinidad Designer", "monto_tc": 32100, "monto_td": 86595, "monto_amex": 0, "total": 118695}, {"id": 70, "cliente": "GRUPO VITALIS", "monto_tc": 60980, "monto_td": 49465.04, "monto_amex": 5410, "total": 115855.04000000001}, {"id": 93, "cliente": "Mexico Handmade", "monto_tc": 109635, "monto_td": 0, "monto_amex": 490, "total": 110125}, {"id": 78, "cliente": "HU", "monto_tc": 57910.57, "monto_td": 50511.28999999999, "monto_amex": 991.31, "total": 109413.16999999998}, {"id": 51, "cliente": "Empire Fitness Galerias Serdan CH", "monto_tc": 31809, "monto_td": 73333, "monto_amex": 0, "total": 105142}, {"id": 59, "cliente": "Empire Fitness Tlahuac", "monto_tc": 53262, "monto_td": 51415, "monto_amex": 0, "total": 104677}, {"id": 121, "cliente": "Todo Corazon", "monto_tc": 40608.5, "monto_td": 25236, "monto_amex": 36505, "total": 102349.5}, {"id": 49, "cliente": "Empire Fitness Finsa", "monto_tc": 38077, "monto_td": 64057, "monto_amex": 0, "total": 102134}, {"id": 36, "cliente": "Dr Juan Domingo Porras", "monto_tc": 45300, "monto_td": 44100, "monto_amex": 10500, "total": 99900}, {"id": 100, "cliente": "NUTRIMET CUAUTLANCINGO", "monto_tc": 30671.199999999997, "monto_td": 68683, "monto_amex": 0, "total": 99354.2}, {"id": 13, "cliente": "CACHITO LINDO Y QUERIDO", "monto_tc": 38640.5, "monto_td": 54723.85, "monto_amex": 0, "total": 93364.35}, {"id": 89, "cliente": "Luna Canela", "monto_tc": 24540.94, "monto_td": 43846, "monto_amex": 22667.5, "total": 91054.44}, {"id": 149, "cliente": "Mayan Art", "monto_tc": 0, "monto_td": 0, "monto_amex": 88771, "total": 88771}, {"id": 2, "cliente": "ADICTO CAFE LA MINERVA", "monto_tc": 34888.79, "monto_td": 51963.00999999998, "monto_amex": 431, "total": 87282.79999999999}, {"id": 7, "cliente": "ARKO PAYMENT SOLUTIONS", "monto_tc": 44857.25, "monto_td": 38832.15, "monto_amex": 3333.25, "total": 87022.65}, {"id": 74, "cliente": "Hostess 4G", "monto_tc": 85000, "monto_td": 0, "monto_amex": 0, "total": 85000}, {"id": 44, "cliente": "Empire Fitness Centro Historico", "monto_tc": 36409, "monto_td": 40854, "monto_amex": 0, "total": 77263}, {"id": 116, "cliente": "Servicios Medicos Integrales", "monto_tc": 65127.159999999996, "monto_td": 11962.240000000002, "monto_amex": 0, "total": 77089.4}, {"id": 56, "cliente": "Empire Fitness Mirador 1", "monto_tc": 37567, "monto_td": 36760, "monto_amex": 479, "total": 74806}, {"id": 52, "cliente": "Empire Fitness Guadalajara", "monto_tc": 46567, "monto_td": 20928, "monto_amex": 4484, "total": 71979}, {"id": 57, "cliente": "Empire Fitness Mirador 2", "monto_tc": 37330, "monto_td": 28768, "monto_amex": 0, "total": 66098}, {"id": 37, "cliente": "DR RODRIGO MONROY CARVAJAL", "monto_tc": 44900, "monto_td": 20500, "monto_amex": 0, "total": 65400}, {"id": 22, "cliente": "Constructora Brumo", "monto_tc": 63666, "monto_td": 0, "monto_amex": 1100, "total": 64766}, {"id": 15, "cliente": "Casa Mexicana", "monto_tc": 14010, "monto_td": 0.01, "monto_amex": 46075, "total": 60085.01}, {"id": 19, "cliente": "Clinica Dental Sonrie", "monto_tc": 31375, "monto_td": 28275, "monto_amex": 0, "total": 59650}, {"id": 34, "cliente": "DR JORGE GARCIA RENTERIA", "monto_tc": 21228, "monto_td": 38382, "monto_amex": 0, "total": 59610}, {"id": 50, "cliente": "Empire Fitness Fortuna", "monto_tc": 27401, "monto_td": 29438, "monto_amex": 0, "total": 56839}, {"id": 118, "cliente": "Super el valle", "monto_tc": 10045, "monto_td": 46094.5, "monto_amex": 0, "total": 56139.5}, {"id": 135, "cliente": "Yacht Cancun", "monto_tc": 0, "monto_td": 3.0199999999999996, "monto_amex": 55400.1, "total": 55403.119999999995}, {"id": 11, "cliente": "Box Box Car Service", "monto_tc": 45108.42, "monto_td": 7719.01, "monto_amex": 2250, "total": 55077.43}, {"id": 31, "cliente": "DR FRANCISCO JAVIER ", "monto_tc": 28110, "monto_td": 26255, "monto_amex": 0, "total": 54365}, {"id": 47, "cliente": "Empire Fitness Ecatepec", "monto_tc": 20979, "monto_td": 32429, "monto_amex": 0, "total": 53408}, {"id": 76, "cliente": "HP", "monto_tc": 20395, "monto_td": 28377, "monto_amex": 0, "total": 48772}, {"id": 119, "cliente": "Templados Varsa", "monto_tc": 5099.91, "monto_td": 41311.57, "monto_amex": 0, "total": 46411.479999999996}, {"id": 87, "cliente": "La Ruta de las Indias", "monto_tc": 8595, "monto_td": 35730, "monto_amex": 1800, "total": 46125}, {"id": 41, "cliente": "Eleven People", "monto_tc": 40683, "monto_td": 3389, "monto_amex": 20, "total": 44092}, {"id": 79, "cliente": "INSTITUTO PANAMERICANO DEL CORAZON", "monto_tc": 14600, "monto_td": 28300, "monto_amex": 0, "total": 42900}, {"id": 26, "cliente": "CR Alimentos", "monto_tc": 14740.5, "monto_td": 24527.75, "monto_amex": 3074.5, "total": 42342.75}, {"id": 127, "cliente": "UNIDAD DE ESPECIALIDADES ORTOPEDICAS", "monto_tc": 4200, "monto_td": 36400, "monto_amex": 1500, "total": 42100}, {"id": 68, "cliente": "Freshify", "monto_tc": 11970.96, "monto_td": 12757.369999999999, "monto_amex": 10919.57, "total": 35647.899999999994}, {"id": 142, "cliente": "Ecoden", "monto_tc": 6800, "monto_td": 28100, "monto_amex": 0, "total": 34900}, {"id": 137, "cliente": "Convenia Links de Pago", "monto_tc": 33000, "monto_td": 0, "monto_amex": 0, "total": 33000}, {"id": 43, "cliente": "Empire Fitness Acocota", "monto_tc": 22291, "monto_td": 8181, "monto_amex": 0, "total": 30472}, {"id": 113, "cliente": "RODANE", "monto_tc": 17740.25, "monto_td": 11713.58, "monto_amex": 0, "total": 29453.83}, {"id": 104, "cliente": "PADEL WORLD", "monto_tc": 13855, "monto_td": 10405, "monto_amex": 3850, "total": 28110}, {"id": 30, "cliente": "DR FERNANDO ZARAIN", "monto_tc": 9100, "monto_td": 18000, "monto_amex": 0, "total": 27100}, {"id": 133, "cliente": "WHY WAIT", "monto_tc": 7800, "monto_td": 5000, "monto_amex": 13360, "total": 26160}, {"id": 110, "cliente": "Quesos Chiapas 2", "monto_tc": 10047, "monto_td": 10630.9, "monto_amex": 5299.51, "total": 25977.410000000003}, {"id": 77, "cliente": "HS", "monto_tc": 9748, "monto_td": 15103, "monto_amex": 0, "total": 24851}, {"id": 32, "cliente": "DR GERARDO CASTORENA ROJI", "monto_tc": 13000, "monto_td": 11000, "monto_amex": 0, "total": 24000}, {"id": 115, "cliente": "SANTUARIO PIO", "monto_tc": 8780, "monto_td": 12135, "monto_amex": 0, "total": 20915}, {"id": 63, "cliente": "FEDEDOME", "monto_tc": 11234, "monto_td": 8984, "monto_amex": 0, "total": 20218}, {"id": 132, "cliente": "Wallfine", "monto_tc": 18501.15, "monto_td": 0, "monto_amex": 0, "total": 18501.15}, {"id": 94, "cliente": "MJ", "monto_tc": 7720, "monto_td": 10525, "monto_amex": 0, "total": 18245}, {"id": 38, "cliente": "DUMEDIC", "monto_tc": 4487, "monto_td": 0, "monto_amex": 13165, "total": 17652}, {"id": 96, "cliente": "Montajes Operativos", "monto_tc": 1682, "monto_td": 12532, "monto_amex": 0, "total": 14214}, {"id": 29, "cliente": "DR FELIX URBINA", "monto_tc": 4100, "monto_td": 8200, "monto_amex": 0, "total": 12300}, {"id": 58, "cliente": "Empire Fitness San Martin", "monto_tc": 4330, "monto_td": 5930, "monto_amex": 0, "total": 10260}, {"id": 97, "cliente": "Mt Mechanics", "monto_tc": 9560.02, "monto_td": 0, "monto_amex": 0, "total": 9560.02}, {"id": 71, "cliente": "Hacienda Soleil", "monto_tc": 5834.9, "monto_td": 3050.95, "monto_amex": 0, "total": 8885.849999999999}, {"id": 33, "cliente": "DR JESUS PONCE ONCOPEDIA", "monto_tc": 1000, "monto_td": 7800, "monto_amex": 0, "total": 8800}, {"id": 66, "cliente": "Frans Automotive", "monto_tc": 2000, "monto_td": 6510, "monto_amex": 0, "total": 8510}, {"id": 129, "cliente": "UROLOGIA FUNCIONAL", "monto_tc": 4500, "monto_td": 3600, "monto_amex": 0, "total": 8100}, {"id": 3, "cliente": "AJEDREZ", "monto_tc": 3590, "monto_td": 3590, "monto_amex": 0, "total": 7180}, {"id": 108, "cliente": "Potato Shop", "monto_tc": 7000, "monto_td": 0, "monto_amex": 0, "total": 7000}, {"id": 106, "cliente": "Playa Kaleta Restaurante", "monto_tc": 678.5, "monto_td": 5762.200000000001, "monto_amex": 0, "total": 6440.700000000001}, {"id": 109, "cliente": "Quesos Chiapas", "monto_tc": 1190, "monto_td": 4830, "monto_amex": 0, "total": 6020}, {"id": 23, "cliente": "CONSULTA MEDICA DU", "monto_tc": 1200, "monto_td": 4600, "monto_amex": 0, "total": 5800}, {"id": 9, "cliente": "Bar La Oficina", "monto_tc": 485, "monto_td": 4456, "monto_amex": 759, "total": 5700}, {"id": 6, "cliente": "Antojo Gula", "monto_tc": 2894.4, "monto_td": 2520.3, "monto_amex": 0, "total": 5414.700000000001}, {"id": 90, "cliente": "Manik Odontologia", "monto_tc": 3800, "monto_td": 1550, "monto_amex": 0, "total": 5350}, {"id": 103, "cliente": "OTORRINO LOMAS", "monto_tc": 4930, "monto_td": 0, "monto_amex": 0, "total": 4930}, {"id": 101, "cliente": "NUTRISIM", "monto_tc": 4234.33, "monto_td": 532, "monto_amex": 0, "total": 4766.33}, {"id": 75, "cliente": "Hotel Casa Real", "monto_tc": 625, "monto_td": 3345, "monto_amex": 0, "total": 3970}, {"id": 10, "cliente": "BLACKHAWK", "monto_tc": 1400, "monto_td": 1030, "monto_amex": 580, "total": 3010}, {"id": 80, "cliente": "Joyeria Zafiro", "monto_tc": 0, "monto_td": 0, "monto_amex": 2204, "total": 2204}, {"id": 102, "cliente": "ONOLOA POKE HOUSE", "monto_tc": 1608, "monto_td": 236.5, "monto_amex": 0, "total": 1844.5}, {"id": 67, "cliente": "FRESH SOLUTIONS", "monto_tc": 0, "monto_td": 500, "monto_amex": 0, "total": 500}, {"id": 21, "cliente": "Cocina Montejo", "monto_tc": 250, "monto_td": 202, "monto_amex": 0, "total": 452}, {"id": 105, "cliente": "PadelMatch", "monto_tc": 25, "monto_td": 55, "monto_amex": 0, "total": 80}, {"id": 64, "cliente": "Ferba Sports", "monto_tc": 0, "monto_td": 50, "monto_amex": 0, "total": 50}, {"id": 1, "cliente": "7 Cielos", "monto_tc": 10, "monto_td": 20, "monto_amex": 0, "total": 30}, {"id": 130, "cliente": "Viajes CEUNI", "monto_tc": 11, "monto_td": 0, "monto_amex": 10, "total": 21}, {"id": 112, "cliente": "Rest B", "monto_tc": 10, "monto_td": 0, "monto_amex": 10, "total": 20}, {"id": 4, "cliente": "Amo Tulum Tours", "monto_tc": 0, "monto_td": 11, "monto_amex": 0, "total": 11}, {"id": 17, "cliente": "Centum Cabo", "monto_tc": 11, "monto_td": 0, "monto_amex": 0, "total": 11}, {"id": 18, "cliente": "Centum Capital", "monto_tc": 3.1, "monto_td": 0, "monto_amex": 0, "total": 3.1}, {"id": 122, "cliente": "Tony2", "monto_tc": 0, "monto_td": 0.01, "monto_amex": 1.1, "total": 1.11}, {"id": 107, "cliente": "Poch del Huach Centro", "monto_tc": 0, "monto_td": 1, "monto_amex": 0, "total": 1}, {"id": 114, "cliente": "SANTO CHANCHO", "monto_tc": 1, "monto_td": 0, "monto_amex": 0, "total": 1}, {"id": 134, "cliente": "WICHO", "monto_tc": 1, "monto_td": 0, "monto_amex": 0, "total": 1}, {"id": 145, "cliente": "Focca", "monto_tc": 1, "monto_td": 0, "monto_amex": 0, "total": 1}, {"id": 150, "cliente": "Nutriment 11 Sur", "monto_tc": 0, "monto_td": 1, "monto_amex": 0, "total": 1}, {"id": 81, "cliente": "Jpart", "monto_tc": 0.02, "monto_td": 0, "monto_amex": 0, "total": 0.02}, {"id": 8, "cliente": "BAR 7", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 16, "cliente": "Centro Joyero Centenario", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 25, "cliente": "CONVENIA LINKS DE PAGO", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 28, "cliente": "Dentista Ninos", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 39, "cliente": "ECODEN", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 65, "cliente": "FOCACCIA", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 73, "cliente": "HLT Services", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 82, "cliente": "La Calle", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 88, "cliente": "Lucia Acapulco", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 92, "cliente": "Mayan Art", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 99, "cliente": "Nutriment 11 sur", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 131, "cliente": "VIP del Valle", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 139, "cliente": "Dentalyss Center", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 141, "cliente": "Dr Rogelio Herrera Lima", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 143, "cliente": "Flamingos Palace", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 146, "cliente": "Focca 2", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 147, "cliente": "Iglesia Cristiana", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 151, "cliente": "Arq Alejandro Jimenez", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 152, "cliente": "Camca Automotriz", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 153, "cliente": "Corte Gaucho", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 154, "cliente": "DupratDr", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 155, "cliente": "HD", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 156, "cliente": "La Ruta De Las Indias SF", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 157, "cliente": "Los Amigos", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 158, "cliente": "Obsidiana", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 159, "cliente": "RAWPAW", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}, {"id": 160, "cliente": "TGRS", "monto_tc": 0, "monto_td": 0, "monto_amex": 0, "total": 0}];
const TPV_PAGOS       = [{"id": 12, "cliente": "C CUMBRES", "monto_neto": 8087665.4241688, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 8087665.4241688}, {"id": 84, "cliente": "La Churrasca Atlixco", "monto_neto": 2206414.7115518, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 2206414.7115518}, {"id": 126, "cliente": "Trinidad Designer", "monto_neto": 845491.0811600001, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 845491.0811600001}, {"id": 83, "cliente": "LA CANTADA", "monto_neto": 783376.5708384, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 783376.5708384}, {"id": 123, "cliente": "Tonys Restaurante", "monto_neto": 711781.1729499999, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 711781.1729499999}, {"id": 14, "cliente": "Carlevaro Muebleria", "monto_neto": 635928.6017760001, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 635928.6017760001}, {"id": 40, "cliente": "ECyQ Medical Benefits", "monto_neto": 528090.973, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 528090.973}, {"id": 15, "cliente": "Casa Mexicana", "monto_neto": 475834.67902982666, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 475834.67902982666}, {"id": 91, "cliente": "Mato Grosso", "monto_neto": 401756.2263941999, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 401756.2263941999}, {"id": 98, "cliente": "NORDAY Termos", "monto_neto": 329287.61406199995, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 329287.61406199995}, {"id": 121, "cliente": "Todo Corazon", "monto_neto": 326318.5, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 326318.5}, {"id": 128, "cliente": "UrbanOutled", "monto_neto": 266938.85253760003, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 266938.85253760003}, {"id": 55, "cliente": "Empire Fitness Lomas de Angelopolis", "monto_neto": 260006.22736, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 260006.22736}, {"id": 86, "cliente": "LA CUPULA", "monto_neto": 259548.34386999998, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 259548.34386999998}, {"id": 111, "cliente": "RAMIREZ Y RAMIREZ", "monto_neto": 247516.5, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 247516.5}, {"id": 124, "cliente": "TOP TENT OUTLET", "monto_neto": 236718.2812832, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 236718.2812832}, {"id": 45, "cliente": "Empire Fitness Cholula", "monto_neto": 225094.6024, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 225094.6024}, {"id": 61, "cliente": "Empire Fitness Torres Medicas", "monto_neto": 221345.43388, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 221345.43388}, {"id": 48, "cliente": "Empire Fitness Estambres", "monto_neto": 208279.29084, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 208279.29084}, {"id": 20, "cliente": "Club PH Phonique", "monto_neto": 207191.61000000002, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 207191.61000000002}, {"id": 85, "cliente": "LA CRIANZA", "monto_neto": 201115.1547088, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 201115.1547088}, {"id": 5, "cliente": "AMOBA", "monto_neto": 192017.5863256, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 192017.5863256}, {"id": 120, "cliente": "Tintoreria Easy Clean", "monto_neto": 189475.87488, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 189475.87488}, {"id": 72, "cliente": "HE", "monto_neto": 178618.253908, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 178618.253908}, {"id": 117, "cliente": "SIEMBRA COMEDOR", "monto_neto": 177330.25659, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 177330.25659}, {"id": 95, "cliente": "MOLIENDA SAGRADA", "monto_neto": 169846.41399960002, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 169846.41399960002}, {"id": 53, "cliente": "Empire Fitness Heroes", "monto_neto": 158383.1468, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 158383.1468}, {"id": 125, "cliente": "Topolino", "monto_neto": 157227.54549599998, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 157227.54549599998}, {"id": 60, "cliente": "Empire Fitness Tlaxcala", "monto_neto": 148783.14384, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 148783.14384}, {"id": 24, "cliente": "CONSULTORIO MEDICO DR DAVID FIGUEROA", "monto_neto": 144721.008, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 144721.008}, {"id": 35, "cliente": "DR JUAN DE DIOS QUIROZ", "monto_neto": 143535.3626, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 143535.3626}, {"id": 69, "cliente": "Funky Mama", "monto_neto": 142873.794508, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 142873.794508}, {"id": 135, "cliente": "Yacht Cancun", "monto_neto": 138496.82754165333, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 138496.82754165333}, {"id": 46, "cliente": "Empire Fitness Cienega", "monto_neto": 134460.26472, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 134460.26472}, {"id": 42, "cliente": "Empire Fitness 31 PTE", "monto_neto": 128429.4016, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 128429.4016}, {"id": 78, "cliente": "HU", "monto_neto": 126163.16465919999, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 126163.16465919999}, {"id": 27, "cliente": "DABUTEN", "monto_neto": 120589.8845754, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 120589.8845754}, {"id": 54, "cliente": "Empire Fitness Las Torres", "monto_neto": 117755.58554799999, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 117755.58554799999}, {"id": 62, "cliente": "Empire Fitness Vive la Cienega", "monto_neto": 117583.06884, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 117583.06884}, {"id": 70, "cliente": "GRUPO VITALIS", "monto_neto": 112445.03904, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 112445.03904}, {"id": 93, "cliente": "Mexico Handmade", "monto_neto": 107359.22824, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 107359.22824}, {"id": 100, "cliente": "NUTRIMET CUAUTLANCINGO", "monto_neto": 105140.0262, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 105140.0262}, {"id": 59, "cliente": "Empire Fitness Tlahuac", "monto_neto": 103188.30996, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 103188.30996}, {"id": 51, "cliente": "Empire Fitness Galerias Serdan CH", "monto_neto": 102863.834, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 102863.834}, {"id": 36, "cliente": "Dr Juan Domingo Porras", "monto_neto": 100367.652, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 100367.652}, {"id": 49, "cliente": "Empire Fitness Finsa", "monto_neto": 100045.38144, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 100045.38144}, {"id": 80, "cliente": "Joyeria Zafiro", "monto_neto": 97357.80076, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 97357.80076}, {"id": 13, "cliente": "CACHITO LINDO Y QUERIDO", "monto_neto": 92217.17455000001, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 92217.17455000001}, {"id": 89, "cliente": "Luna Canela", "monto_neto": 88928.03498296, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 88928.03498296}, {"id": 38, "cliente": "DUMEDIC", "monto_neto": 88446.78864, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 88446.78864}, {"id": 2, "cliente": "ADICTO CAFE LA MINERVA", "monto_neto": 87511.34197, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 87511.34197}, {"id": 133, "cliente": "WHY WAIT", "monto_neto": 87165, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 87165}, {"id": 7, "cliente": "ARKO PAYMENT SOLUTIONS", "monto_neto": 85813.57406999999, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 85813.57406999999}, {"id": 52, "cliente": "Empire Fitness Guadalajara", "monto_neto": 84738.21284, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 84738.21284}, {"id": 74, "cliente": "Hostess 4G", "monto_neto": 82870.24, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 82870.24}, {"id": 44, "cliente": "Empire Fitness Centro Historico", "monto_neto": 76052.74536, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 76052.74536}, {"id": 116, "cliente": "Servicios Medicos Integrales", "monto_neto": 74544.6792784, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 74544.6792784}, {"id": 56, "cliente": "Empire Fitness Mirador 1", "monto_neto": 73279.7092, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 73279.7092}, {"id": 73, "cliente": "HLT Services", "monto_neto": 68283.08172, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 68283.08172}, {"id": 19, "cliente": "Clinica Dental Sonrie", "monto_neto": 64748.362, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 64748.362}, {"id": 57, "cliente": "Empire Fitness Mirador 2", "monto_neto": 64334.50536, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 64334.50536}, {"id": 37, "cliente": "DR RODRIGO MONROY CARVAJAL", "monto_neto": 63503.4, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 63503.4}, {"id": 22, "cliente": "Constructora Brumo", "monto_neto": 63128.676704, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 63128.676704}, {"id": 34, "cliente": "DR JORGE GARCIA RENTERIA", "monto_neto": 57881.31, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 57881.31}, {"id": 50, "cliente": "Empire Fitness Fortuna", "monto_neto": 55322.53548, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 55322.53548}, {"id": 11, "cliente": "Box Box Car Service", "monto_neto": 55077.43, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 55077.43}, {"id": 118, "cliente": "Super el valle", "monto_neto": 54689.3462, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 54689.3462}, {"id": 31, "cliente": "DR FRANCISCO JAVIER ", "monto_neto": 52788.415, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 52788.415}, {"id": 47, "cliente": "Empire Fitness Ecatepec", "monto_neto": 51983.07456, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 51983.07456}, {"id": 76, "cliente": "HP", "monto_neto": 47357.612, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 47357.612}, {"id": 87, "cliente": "La Ruta de las Indias", "monto_neto": 46533.70836, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 46533.70836}, {"id": 119, "cliente": "Templados Varsa", "monto_neto": 45312.25326072, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 45312.25326072}, {"id": 41, "cliente": "Eleven People", "monto_neto": 42620.44604, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 42620.44604}, {"id": 127, "cliente": "UNIDAD DE ESPECIALIDADES ORTOPEDICAS", "monto_neto": 42019.244, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 42019.244}, {"id": 79, "cliente": "INSTITUTO PANAMERICANO DEL CORAZON", "monto_neto": 41655.9, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 41655.9}, {"id": 26, "cliente": "CR Alimentos", "monto_neto": 41609.64778, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 41609.64778}, {"id": 68, "cliente": "Freshify", "monto_neto": 34570.147015999995, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 34570.147015999995}, {"id": 115, "cliente": "SANTUARIO PIO", "monto_neto": 33817.03418, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 33817.03418}, {"id": 43, "cliente": "Empire Fitness Acocota", "monto_neto": 29791.7244, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 29791.7244}, {"id": 30, "cliente": "DR FERNANDO ZARAIN", "monto_neto": 29199.26, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 29199.26}, {"id": 110, "cliente": "Quesos Chiapas 2", "monto_neto": 29117.410000000003, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 29117.410000000003}, {"id": 104, "cliente": "PADEL WORLD", "monto_neto": 28816.9008, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 28816.9008}, {"id": 113, "cliente": "RODANE", "monto_neto": 28599.66893, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 28599.66893}, {"id": 77, "cliente": "HS", "monto_neto": 25476.729, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 25476.729}, {"id": 32, "cliente": "DR GERARDO CASTORENA ROJI", "monto_neto": 24265.72, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 24265.72}, {"id": 63, "cliente": "FEDEDOME", "monto_neto": 19848.94784, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 19848.94784}, {"id": 132, "cliente": "Wallfine", "monto_neto": 17878.771314, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 17878.771314}, {"id": 94, "cliente": "MJ", "monto_neto": 17715.895, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 17715.895}, {"id": 21, "cliente": "Cocina Montejo", "monto_neto": 15385.811298666667, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 15385.811298666667}, {"id": 96, "cliente": "Montajes Operativos", "monto_neto": 13779.4524, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 13779.4524}, {"id": 29, "cliente": "DR FELIX URBINA", "monto_neto": 11943.3, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 11943.3}, {"id": 9, "cliente": "Bar La Oficina", "monto_neto": 11101, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 11101}, {"id": 66, "cliente": "Frans Automotive", "monto_neto": 10710, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 10710}, {"id": 58, "cliente": "Empire Fitness San Martin", "monto_neto": 9986.2632, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 9986.2632}, {"id": 97, "cliente": "Mt Mechanics", "monto_neto": 9338.227536, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 9338.227536}, {"id": 129, "cliente": "UROLOGIA FUNCIONAL", "monto_neto": 8730.648, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 8730.648}, {"id": 71, "cliente": "Hacienda Soleil", "monto_neto": 8628.160349999998, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 8628.160349999998}, {"id": 33, "cliente": "DR JESUS PONCE ONCOPEDIA", "monto_neto": 8544.8, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 8544.8}, {"id": 16, "cliente": "Centro Joyero Centenario", "monto_neto": 8333.66592, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 8333.66592}, {"id": 3, "cliente": "AJEDREZ", "monto_neto": 7038.4104, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 7038.4104}, {"id": 108, "cliente": "Potato Shop", "monto_neto": 6837.6, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 6837.6}, {"id": 106, "cliente": "Playa Kaleta Restaurante", "monto_neto": 6440.700000000001, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 6440.700000000001}, {"id": 90, "cliente": "Manik Odontologia", "monto_neto": 6081.558333333333, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 6081.558333333333}, {"id": 10, "cliente": "BLACKHAWK", "monto_neto": 5898.6661466666665, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 5898.6661466666665}, {"id": 109, "cliente": "Quesos Chiapas", "monto_neto": 5840.17448, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 5840.17448}, {"id": 23, "cliente": "CONSULTA MEDICA DU", "monto_neto": 5631.8, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 5631.8}, {"id": 6, "cliente": "Antojo Gula", "monto_neto": 5392.603016000001, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 5392.603016000001}, {"id": 8, "cliente": "BAR 7", "monto_neto": 4808.6, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 4808.6}, {"id": 103, "cliente": "OTORRINO LOMAS", "monto_neto": 4787.03, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 4787.03}, {"id": 101, "cliente": "NUTRISIM", "monto_neto": 4628.10643, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 4628.10643}, {"id": 75, "cliente": "Hotel Casa Real", "monto_neto": 3970, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 3970}, {"id": 102, "cliente": "ONOLOA POKE HOUSE", "monto_neto": 1783.41121, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 1783.41121}, {"id": 67, "cliente": "FRESH SOLUTIONS", "monto_neto": 487.49133333333333, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 487.49133333333333}, {"id": 105, "cliente": "PadelMatch", "monto_neto": 75.36, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 75.36}, {"id": 64, "cliente": "Ferba Sports", "monto_neto": 50, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 50}, {"id": 1, "cliente": "7 Cielos", "monto_neto": 29.0604, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 29.0604}, {"id": 130, "cliente": "Viajes CEUNI", "monto_neto": 20.2982, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 20.2982}, {"id": 112, "cliente": "Rest B", "monto_neto": 19.3272, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 19.3272}, {"id": 17, "cliente": "Centum Cabo", "monto_neto": 11, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 11}, {"id": 4, "cliente": "Amo Tulum Tours", "monto_neto": 10.66824, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 10.66824}, {"id": 18, "cliente": "Centum Capital", "monto_neto": 3.1, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 3.1}, {"id": 122, "cliente": "Tony2", "monto_neto": 1.0675962, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 1.0675962}, {"id": 107, "cliente": "Poch del Huach Centro", "monto_neto": 1, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 1}, {"id": 114, "cliente": "SANTO CHANCHO", "monto_neto": 0.974944, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0.974944}, {"id": 134, "cliente": "WICHO", "monto_neto": 0.96636, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0.96636}, {"id": 81, "cliente": "Jpart", "monto_neto": 0.0193272, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0.0193272}, {"id": 25, "cliente": "CONVENIA LINKS DE PAGO", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 28, "cliente": "Dentista Ninos", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 39, "cliente": "ECODEN", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 65, "cliente": "FOCACCIA", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 82, "cliente": "La Calle", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 88, "cliente": "Lucia Acapulco", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 92, "cliente": "Mayan Art", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 99, "cliente": "Nutriment 11 sur", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}, {"id": 131, "cliente": "VIP del Valle", "monto_neto": 0, "sub_tarjeta": 0, "sub_bancario": 0, "total_pagos": 0, "saldo_pendiente": 0}];
const TPV_AGENTES     = [{"agente": "Angel Ahedo", "siglas": "AA", "pct": 0.1, "vendido": 19032351.9, "com_salem": 182908.00314611994, "com_agente": 18290.800314611995, "clientes": 174, "activos": 112, "pagado": 0, "pendiente": 18290.800314611995}, {"agente": "Javier Diez", "siglas": "JD", "pct": 0.1, "vendido": 2560591.4299999997, "com_salem": 0, "com_agente": 0, "clientes": 6, "activos": 0, "pagado": 0, "pendiente": 0}, {"agente": "Emiliano Mendoza", "siglas": "EM", "pct": 0.1, "vendido": 1083199.83, "com_salem": 7143.639808799998, "com_agente": 714.3639808799999, "clientes": 7, "activos": 5, "pagado": 0, "pendiente": 714.3639808799999}, {"agente": "Joaquin Vallejo", "siglas": "JV", "pct": 0.1, "vendido": 0, "com_salem": 0, "com_agente": 0, "clientes": 0, "activos": 0, "pagado": 0, "pendiente": 0}, {"agente": "Adrian Roman", "siglas": "AR", "pct": 0.1, "vendido": 16195961.3, "com_salem": 157841.13695400002, "com_agente": 15784.113695400003, "clientes": 6, "activos": 2, "pagado": 0, "pendiente": 15784.113695400003}, {"agente": "Monica Gonzalez", "siglas": "MG", "pct": 0.1, "vendido": 7000, "com_salem": 9.743999999999998, "com_agente": 0.9743999999999998, "clientes": 3, "activos": 1, "pagado": 0, "pendiente": 0.9743999999999998}, {"agente": "Jose de la Rosa", "siglas": "JR", "pct": 0.1, "vendido": 42792.41, "com_salem": 112.0792, "com_agente": 11.207920000000001, "clientes": 2, "activos": 2, "pagado": 0, "pendiente": 11.207920000000001}];
const TPV_TERMINALES  = [{"cliente": "La Churrasca Atlixco", "num_term": 3, "terminal_id": "01610015202405212245", "ultimo_uso": "2026-02-04", "ingresos": 1237393.6100000006, "transacciones": 389, "promedio": 3180.9604370179964, "dias_sin_uso": 19}, {"cliente": "Trinidad Designer", "num_term": 1, "terminal_id": "01610016202411271531", "ultimo_uso": "", "ingresos": 932161, "transacciones": 160, "promedio": 5826.00625, "dias_sin_uso": 4}, {"cliente": "Carlevaro Muebleria", "num_term": 2, "terminal_id": "01610060202309270202", "ultimo_uso": "2026-02-19", "ingresos": 669845, "transacciones": 27, "promedio": 24809.074074074073, "dias_sin_uso": 4}, {"cliente": "ECYQ Medical Benefits", "num_term": 1, "terminal_id": "01610060202309270969", "ultimo_uso": "2026-01-29", "ingresos": 543863, "transacciones": 16, "promedio": 33991.4375, "dias_sin_uso": 25}, {"cliente": "Mato Grosso", "num_term": 1, "terminal_id": "01610015202405211065", "ultimo_uso": "2026-02-04", "ingresos": 414900.4300000003, "transacciones": 318, "promedio": 1304.7183333333342, "dias_sin_uso": 19}, {"cliente": "Mayan Art", "num_term": 1, "terminal_id": "01610015202405211415", "ultimo_uso": "2026-02-15", "ingresos": 375563, "transacciones": 22, "promedio": 17071.045454545456, "dias_sin_uso": 8}, {"cliente": "NORDAY Termos", "num_term": 2, "terminal_id": "01610015202405211521", "ultimo_uso": "2026-02-23", "ingresos": 350409.35, "transacciones": 339, "promedio": 1033.6558997050147, "dias_sin_uso": 0}, {"cliente": "RAMIREZ Y RAMIREZ", "num_term": 1, "terminal_id": "01610060202309271354", "ultimo_uso": "2026-02-19", "ingresos": 342900, "transacciones": 14, "promedio": 24492.85714285714, "dias_sin_uso": 4}, {"cliente": "Todo Corazon", "num_term": 1, "terminal_id": "01610015202405211066", "ultimo_uso": "2026-02-05", "ingresos": 336938.5, "transacciones": 285, "promedio": 1182.240350877193, "dias_sin_uso": 18}, {"cliente": "Del Valle", "num_term": 4, "terminal_id": "01610080202310110215", "ultimo_uso": "2026-01-22", "ingresos": 304330, "transacciones": 260, "promedio": 1170.5, "dias_sin_uso": 32}, {"cliente": "LA CUPULA", "num_term": 1, "terminal_id": "01610060202309271370", "ultimo_uso": "2026-02-18", "ingresos": 304097.35, "transacciones": 272, "promedio": 1118.004963235294, "dias_sin_uso": 5}, {"cliente": "Empire Fitness Lomas de Angelopolis", "num_term": 1, "terminal_id": "01610060202309271357", "ultimo_uso": "2026-01-15", "ingresos": 278904, "transacciones": 669, "promedio": 416.8968609865471, "dias_sin_uso": 39}, {"cliente": "Tonys Restaurante", "num_term": 2, "terminal_id": "01610060202309271282", "ultimo_uso": "2026-01-07", "ingresos": 274800.44999999995, "transacciones": 84, "promedio": 3271.433928571428, "dias_sin_uso": 47}, {"cliente": "HE", "num_term": 1, "terminal_id": "01610060202309270570", "ultimo_uso": "2026-02-19", "ingresos": 255002.83999999994, "transacciones": 259, "promedio": 984.5669498069495, "dias_sin_uso": 4}, {"cliente": "Empire Fitness Torres Medicas", "num_term": 1, "terminal_id": "01610015202405212277", "ultimo_uso": "2026-01-16", "ingresos": 253263, "transacciones": 508, "promedio": 498.5492125984252, "dias_sin_uso": 38}, {"cliente": "Empire Fitness Cholula", "num_term": 1, "terminal_id": "01610060202309270414", "ultimo_uso": "2026-01-15", "ingresos": 251316, "transacciones": 423, "promedio": 594.1276595744681, "dias_sin_uso": 39}, {"cliente": "Empire Fitness Estambres", "num_term": 1, "terminal_id": "01610060202309270897", "ultimo_uso": "2026-02-06", "ingresos": 228221, "transacciones": 407, "promedio": 560.7395577395578, "dias_sin_uso": 17}, {"cliente": "SIEMBRA COMEDOR", "num_term": 1, "terminal_id": "01610060202309270304", "ultimo_uso": "2026-02-11", "ingresos": 215724.45, "transacciones": 893, "promedio": 241.57273236282197, "dias_sin_uso": 12}, {"cliente": "Casa Mexicana", "num_term": 3, "terminal_id": "01610015202405211090", "ultimo_uso": "2026-02-19", "ingresos": 213702, "transacciones": 20, "promedio": 10685.1, "dias_sin_uso": 4}, {"cliente": "Tintoreria Easy Clean", "num_term": 2, "terminal_id": "01610015202405210903", "ultimo_uso": "2026-02-19", "ingresos": 211152, "transacciones": 312, "promedio": 676.7692307692307, "dias_sin_uso": 4}, {"cliente": "MOLIENDA SAGRADA", "num_term": 1, "terminal_id": "01610015202405210923", "ultimo_uso": "2026-02-20", "ingresos": 201201.4899999999, "transacciones": 285, "promedio": 705.9701403508768, "dias_sin_uso": 3}, {"cliente": "CONSULTORIO MEDICO DR DAVID FIGUEROA", "num_term": 1, "terminal_id": "01610015202405212262", "ultimo_uso": "2026-02-20", "ingresos": 191900, "transacciones": 124, "promedio": 1547.5806451612902, "dias_sin_uso": 3}, {"cliente": "Dentista Ninos", "num_term": 1, "terminal_id": "01610060202309270337", "ultimo_uso": "2026-02-19", "ingresos": 182260, "transacciones": 96, "promedio": 1898.5416666666667, "dias_sin_uso": 4}, {"cliente": "Funky Mama", "num_term": 1, "terminal_id": "01610060202309270831", "ultimo_uso": "2026-02-18", "ingresos": 177322.94999999998, "transacciones": 474, "promedio": 374.09905063291137, "dias_sin_uso": 5}, {"cliente": "Empire Fitness Tlaxcala", "num_term": 1, "terminal_id": "01610015202405212174", "ultimo_uso": "2026-01-17", "ingresos": 177314, "transacciones": 342, "promedio": 518.4619883040936, "dias_sin_uso": 37}, {"cliente": "Empire Fitness Heroes", "num_term": 1, "terminal_id": "01610015202405211572", "ultimo_uso": "2026-01-16", "ingresos": 172823, "transacciones": 359, "promedio": 481.4011142061281, "dias_sin_uso": 38}, {"cliente": "Yacht Cancun", "num_term": 1, "terminal_id": "01610060202309271147", "ultimo_uso": "", "ingresos": 169967.58000000002, "transacciones": 17, "promedio": 9998.092941176472, "dias_sin_uso": 3}, {"cliente": "DR JUAN DE DIOS QUIROZ", "num_term": 1, "terminal_id": "01610060202309270759", "ultimo_uso": "2026-02-20", "ingresos": 169171, "transacciones": 96, "promedio": 1762.1979166666667, "dias_sin_uso": 3}, {"cliente": "Empire Fitness Cienega", "num_term": 1, "terminal_id": "01610060202309270679", "ultimo_uso": "2026-01-15", "ingresos": 164474, "transacciones": 315, "promedio": 522.1396825396826, "dias_sin_uso": 39}, {"cliente": "HU", "num_term": 1, "terminal_id": "01610060202309270277", "ultimo_uso": "2026-02-23", "ingresos": 154778.61, "transacciones": 124, "promedio": 1248.2145967741935, "dias_sin_uso": 0}, {"cliente": "DABUTEN", "num_term": 1, "terminal_id": "01610015202405211673", "ultimo_uso": "2026-02-19", "ingresos": 150721.94000000003, "transacciones": 145, "promedio": 1039.461655172414, "dias_sin_uso": 4}, {"cliente": "Empire Fitness 31 PTE", "num_term": 1, "terminal_id": "01610060202309270703", "ultimo_uso": "2026-01-16", "ingresos": 145020, "transacciones": 268, "promedio": 541.1194029850747, "dias_sin_uso": 38}, {"cliente": "Empire Fitness Las Torres", "num_term": 1, "terminal_id": "01610060202309270922", "ultimo_uso": "2026-01-15", "ingresos": 139091.9, "transacciones": 348, "promedio": 399.68936781609193, "dias_sin_uso": 39}, {"cliente": "Empire Fitness Vive la Cienega", "num_term": 1, "terminal_id": "01610015202405212272", "ultimo_uso": "2026-01-15", "ingresos": 139065, "transacciones": 236, "promedio": 589.2584745762712, "dias_sin_uso": 39}, {"cliente": "NUTRIMET CUAUTLANCINGO", "num_term": 1, "terminal_id": "01610060202309270931", "ultimo_uso": "2026-02-19", "ingresos": 137914.2, "transacciones": 96, "promedio": 1436.60625, "dias_sin_uso": 4}, {"cliente": "Joyeria Zafiro", "num_term": 1, "terminal_id": "01610015202405211534", "ultimo_uso": "2026-02-19", "ingresos": 132233, "transacciones": 8, "promedio": 16529.125, "dias_sin_uso": 4}, {"cliente": "Empire Fitness Tlahuac", "num_term": 1, "terminal_id": "01610060202309270512", "ultimo_uso": "2026-01-16", "ingresos": 128079, "transacciones": 124, "promedio": 1032.8951612903227, "dias_sin_uso": 38}, {"cliente": "C CUMBRES", "num_term": 9, "terminal_id": "01610015202405211522", "ultimo_uso": "2026-02-20", "ingresos": 128003.45, "transacciones": 498, "promedio": 257.03504016064255, "dias_sin_uso": 3}, {"cliente": "UrbanOutled", "num_term": 5, "terminal_id": "01610015202405210940", "ultimo_uso": "", "ingresos": 125011.20000000001, "transacciones": 177, "promedio": 706.277966101695, "dias_sin_uso": 4}, {"cliente": "GRUPO VITALIS", "num_term": 1, "terminal_id": "01610060202309271416", "ultimo_uso": "2026-02-19", "ingresos": 124385.04, "transacciones": 72, "promedio": 1727.57, "dias_sin_uso": 4}, {"cliente": "Empire Fitness Finsa", "num_term": 1, "terminal_id": "01610060202309270320", "ultimo_uso": "2026-01-15", "ingresos": 123084, "transacciones": 222, "promedio": 554.4324324324324, "dias_sin_uso": 39}, {"cliente": "LA CANTADA", "num_term": 8, "terminal_id": "01610015202405210936", "ultimo_uso": "2026-02-23", "ingresos": 119671.95, "transacciones": 90, "promedio": 1329.6883333333333, "dias_sin_uso": 0}, {"cliente": "DUMEDIC", "num_term": 2, "terminal_id": "01610015202405210005", "ultimo_uso": "2026-02-17", "ingresos": 118709, "transacciones": 24, "promedio": 4946.208333333333, "dias_sin_uso": 6}, {"cliente": "Empire Fitness Galerias Serdan CH", "num_term": 2, "terminal_id": "01610060202309270201", "ultimo_uso": "2026-01-19", "ingresos": 115005, "transacciones": 223, "promedio": 515.7174887892377, "dias_sin_uso": 35}, {"cliente": "Dr Juan Domingo Porras", "num_term": 1, "terminal_id": "01610060202309270763", "ultimo_uso": "2026-02-20", "ingresos": 112400, "transacciones": 86, "promedio": 1306.9767441860465, "dias_sin_uso": 3}, {"cliente": "Mexico Handmade", "num_term": 1, "terminal_id": "01610015202405211508", "ultimo_uso": "2026-02-23", "ingresos": 110125, "transacciones": 16, "promedio": 6882.8125, "dias_sin_uso": 0}, {"cliente": "Clinica Dental Sonrie", "num_term": 1, "terminal_id": "01610060202309270989", "ultimo_uso": "2026-02-19", "ingresos": 101450, "transacciones": 67, "promedio": 1514.1791044776119, "dias_sin_uso": 4}, {"cliente": "Empire Fitness Guadalajara", "num_term": 1, "terminal_id": "01610015202405210912", "ultimo_uso": "2026-01-16", "ingresos": 101026, "transacciones": 211, "promedio": 478.7962085308057, "dias_sin_uso": 38}, {"cliente": "FOCACCIA", "num_term": 9, "terminal_id": "01610060202309271247", "ultimo_uso": "2026-01-16", "ingresos": 97544, "transacciones": 145, "promedio": 672.7172413793104, "dias_sin_uso": 38}, {"cliente": "BAR 7", "num_term": 1, "terminal_id": "01610015202405210003", "ultimo_uso": "2026-02-17", "ingresos": 94400, "transacciones": 4, "promedio": 23600, "dias_sin_uso": 6}, {"cliente": "ADICTO CAFE LA MINERVA", "num_term": 1, "terminal_id": "01610015202405211037", "ultimo_uso": "2026-02-06", "ingresos": 90670.55000000003, "transacciones": 436, "promedio": 207.95997706422025, "dias_sin_uso": 17}, {"cliente": "WHY WAIT", "num_term": 1, "terminal_id": "01610016202411271114", "ultimo_uso": "", "ingresos": 90165, "transacciones": 27, "promedio": 3339.4444444444443, "dias_sin_uso": 17}, {"cliente": "Empire Fitness Centro Historico", "num_term": 1, "terminal_id": "01610015202405212258", "ultimo_uso": "2026-01-16", "ingresos": 89915, "transacciones": 156, "promedio": 576.3782051282051, "dias_sin_uso": 38}, {"cliente": "TOP TENT OUTLET", "num_term": 3, "terminal_id": "01610015202405210055", "ultimo_uso": "2026-02-15", "ingresos": 89779.6, "transacciones": 97, "promedio": 925.5628865979382, "dias_sin_uso": 8}, {"cliente": "SERVICIOS MEDICOS INTEGRALES", "num_term": 1, "terminal_id": "01610060202309270765", "ultimo_uso": "2026-02-10", "ingresos": 86046.22, "transacciones": 9, "promedio": 9560.691111111111, "dias_sin_uso": 13}, {"cliente": "Topolino", "num_term": 2, "terminal_id": "01610060202309270319", "ultimo_uso": "", "ingresos": 85832.56999999998, "transacciones": 207, "promedio": 414.6500966183574, "dias_sin_uso": 3}, {"cliente": "Empire Fitness Mirador 1", "num_term": 1, "terminal_id": "01610015202405212287", "ultimo_uso": "2026-01-15", "ingresos": 85762, "transacciones": 174, "promedio": 492.88505747126436, "dias_sin_uso": 39}, {"cliente": "Hostess 4G", "num_term": 1, "terminal_id": "01610015202405210892", "ultimo_uso": "2026-01-25", "ingresos": 85000, "transacciones": 3, "promedio": 28333.333333333332, "dias_sin_uso": 29}, {"cliente": "DR RODRIGO MONROY CARVAJAL", "num_term": 1, "terminal_id": "01610015202405212252", "ultimo_uso": "2026-02-18", "ingresos": 81200, "transacciones": 42, "promedio": 1933.3333333333333, "dias_sin_uso": 5}, {"cliente": "Lucia Acapulco", "num_term": 8, "terminal_id": "01610015202405210952", "ultimo_uso": "2026-02-18", "ingresos": 76350, "transacciones": 96, "promedio": 795.3125, "dias_sin_uso": 5}, {"cliente": "HLT Services", "num_term": 1, "terminal_id": "-", "ultimo_uso": "2026-01-13", "ingresos": 71001, "transacciones": 2, "promedio": 35500.5, "dias_sin_uso": 41}, {"cliente": "HP", "num_term": 1, "terminal_id": "01610015202405211064", "ultimo_uso": "2026-02-19", "ingresos": 70918, "transacciones": 70, "promedio": 1013.1142857142858, "dias_sin_uso": 4}, {"cliente": "Empire Fitness Mirador 2", "num_term": 1, "terminal_id": "01610060202309271467", "ultimo_uso": "2026-01-15", "ingresos": 70684, "transacciones": 172, "promedio": 410.95348837209303, "dias_sin_uso": 39}, {"cliente": "DR JORGE GARCIA RENTERIA", "num_term": 1, "terminal_id": "01610015202405212176", "ultimo_uso": "2026-02-19", "ingresos": 68280, "transacciones": 44, "promedio": 1551.8181818181818, "dias_sin_uso": 4}, {"cliente": "Club PH Phonique ", "num_term": 5, "terminal_id": "01610015202405211663", "ultimo_uso": "2026-02-17", "ingresos": 64908, "transacciones": 11, "promedio": 5900.727272727273, "dias_sin_uso": 6}, {"cliente": "Constructora Brumo", "num_term": 1, "terminal_id": "01610015202405211508", "ultimo_uso": "2026-02-19", "ingresos": 64766, "transacciones": 9, "promedio": 7196.222222222223, "dias_sin_uso": 4}, {"cliente": "Luna Canela", "num_term": 6, "terminal_id": "01610015202405211060", "ultimo_uso": "2026-02-08", "ingresos": 64757, "transacciones": 94, "promedio": 688.9042553191489, "dias_sin_uso": 15}, {"cliente": "LA CRIANZA", "num_term": 3, "terminal_id": "01610016202411271651", "ultimo_uso": "2026-02-20", "ingresos": 63891.45, "transacciones": 31, "promedio": 2061.014516129032, "dias_sin_uso": 3}, {"cliente": "Super el valle", "num_term": 1, "terminal_id": "01610015202405211580", "ultimo_uso": "2026-02-19", "ingresos": 63698.5, "transacciones": 514, "promedio": 123.92704280155642, "dias_sin_uso": 4}, {"cliente": "RODANE", "num_term": 1, "terminal_id": "01610015202405211063", "ultimo_uso": "2026-02-18", "ingresos": 58222.380000000005, "transacciones": 17, "promedio": 3424.8458823529413, "dias_sin_uso": 5}, {"cliente": "Empire Fitness Fortuna", "num_term": 1, "terminal_id": "01610015202405211574", "ultimo_uso": "2026-01-16", "ingresos": 57137, "transacciones": 96, "promedio": 595.1770833333334, "dias_sin_uso": 38}, {"cliente": "Empire Fitness Ecatepec", "num_term": 1, "terminal_id": "01610015202405212136", "ultimo_uso": "2026-01-16", "ingresos": 56530, "transacciones": 105, "promedio": 538.3809523809524, "dias_sin_uso": 38}, {"cliente": "La Ruta de las Indias", "num_term": 1, "terminal_id": "01610015202405211634", "ultimo_uso": "2026-02-19", "ingresos": 55815, "transacciones": 37, "promedio": 1508.5135135135135, "dias_sin_uso": 4}, {"cliente": "CR Alimentos", "num_term": 1, "terminal_id": "01610015202405210256", "ultimo_uso": "2026-02-23", "ingresos": 55624.25, "transacciones": 128, "promedio": 434.564453125, "dias_sin_uso": 0}, {"cliente": "DR FRANCISCO JAVIER", "num_term": 1, "terminal_id": "01610060202309271221", "ultimo_uso": "2026-01-21", "ingresos": 54365, "transacciones": 28, "promedio": 1941.607142857143, "dias_sin_uso": 33}, {"cliente": "UNIDAD DE ESPECIALIDADES ORTOPEDICAS", "num_term": 1, "terminal_id": "01610015202405210930", "ultimo_uso": "", "ingresos": 54300, "transacciones": 11, "promedio": 4936.363636363636, "dias_sin_uso": 10}, {"cliente": "Templados Varsa", "num_term": 1, "terminal_id": "01610015202405212450", "ultimo_uso": "2026-02-19", "ingresos": 50800.649999999994, "transacciones": 34, "promedio": 1494.1367647058821, "dias_sin_uso": 4}, {"cliente": "CACHITO LINDO Y QUERIDO", "num_term": 2, "terminal_id": "01610015202405210944", "ultimo_uso": "2026-01-03", "ingresos": 50633, "transacciones": 33, "promedio": 1534.3333333333333, "dias_sin_uso": 51}, {"cliente": "ECODEN", "num_term": 1, "terminal_id": "01610015202405211503", "ultimo_uso": "2026-02-19", "ingresos": 48600, "transacciones": 55, "promedio": 883.6363636363636, "dias_sin_uso": 4}, {"cliente": "AMOBA", "num_term": 2, "terminal_id": "01610015202405212246", "ultimo_uso": "2026-01-09", "ingresos": 48044.5, "transacciones": 337, "promedio": 142.5652818991098, "dias_sin_uso": 45}, {"cliente": "Box Box Car Service", "num_term": 2, "terminal_id": "01610050202309050002", "ultimo_uso": "2026-02-04", "ingresos": 47047.12, "transacciones": 17, "promedio": 2767.4776470588235, "dias_sin_uso": 19}, {"cliente": "INSTITUTO PANAMERICANO DEL CORAZON", "num_term": 1, "terminal_id": "01610060202309270068", "ultimo_uso": "2026-02-03", "ingresos": 42900, "transacciones": 21, "promedio": 2042.857142857143, "dias_sin_uso": 20}, {"cliente": "ARKO PAYMENT SOLUTIONS", "num_term": 5, "terminal_id": "01610016202411271227", "ultimo_uso": "2026-02-20", "ingresos": 38067, "transacciones": 70, "promedio": 543.8142857142857, "dias_sin_uso": 3}, {"cliente": "NUTRISIM", "num_term": 1, "terminal_id": "01610015202405212261", "ultimo_uso": "2026-02-19", "ingresos": 38060.33, "transacciones": 12, "promedio": 3171.6941666666667, "dias_sin_uso": 4}, {"cliente": "Mt Mechanics", "num_term": 1, "terminal_id": "01610060202309270015", "ultimo_uso": "2026-02-19", "ingresos": 35688.020000000004, "transacciones": 10, "promedio": 3568.8020000000006, "dias_sin_uso": 4}, {"cliente": "Empire Fitness Acocota", "num_term": 1, "terminal_id": "01610015202405211038", "ultimo_uso": "2026-01-16", "ingresos": 33927, "transacciones": 51, "promedio": 665.2352941176471, "dias_sin_uso": 38}, {"cliente": "WHY WAIT ", "num_term": 1, "terminal_id": "01610016202411271114", "ultimo_uso": "", "ingresos": 33500, "transacciones": 7, "promedio": 4785.714285714285, "dias_sin_uso": 4}, {"cliente": "Freshify", "num_term": 2, "terminal_id": "01610060202309270306", "ultimo_uso": "2026-02-10", "ingresos": 33322.979999999996, "transacciones": 18, "promedio": 1851.2766666666664, "dias_sin_uso": 13}, {"cliente": "Quesos Chiapas 2", "num_term": 1, "terminal_id": "01610015202405211039", "ultimo_uso": "2026-02-05", "ingresos": 33130.41, "transacciones": 73, "promedio": 453.84123287671235, "dias_sin_uso": 18}, {"cliente": "CONVENIA LINKS DE PAGO", "num_term": 1, "terminal_id": "-", "ultimo_uso": "2026-01-27", "ingresos": 33000, "transacciones": 1, "promedio": 33000, "dias_sin_uso": 27}, {"cliente": "DR FERNANDO ZARAIN", "num_term": 1, "terminal_id": "01610015202405211058", "ultimo_uso": "2026-02-19", "ingresos": 32600, "transacciones": 27, "promedio": 1207.4074074074074, "dias_sin_uso": 4}, {"cliente": "Todo Corazon ", "num_term": 1, "terminal_id": "01610015202405211066", "ultimo_uso": "2026-02-19", "ingresos": 30964, "transacciones": 34, "promedio": 910.7058823529412, "dias_sin_uso": 4}, {"cliente": "FOCCA 2", "num_term": 1, "terminal_id": "01610016202411271723", "ultimo_uso": "2026-02-17", "ingresos": 30217.410000000003, "transacciones": 71, "promedio": 425.59732394366205, "dias_sin_uso": 6}, {"cliente": "HS", "num_term": 1, "terminal_id": "01610060202309270546", "ultimo_uso": "2026-02-10", "ingresos": 30138, "transacciones": 24, "promedio": 1255.75, "dias_sin_uso": 13}, {"cliente": "DR GERARDO CASTORENA ROJI", "num_term": 1, "terminal_id": "01610015202405212121", "ultimo_uso": "2026-02-17", "ingresos": 29000, "transacciones": 27, "promedio": 1074.0740740740741, "dias_sin_uso": 6}, {"cliente": "MJ", "num_term": 1, "terminal_id": "01610015202405211098", "ultimo_uso": "2026-02-20", "ingresos": 28950.01, "transacciones": 83, "promedio": 348.7953012048193, "dias_sin_uso": 3}, {"cliente": "FLAMINGOS PALACE", "num_term": 3, "terminal_id": "01610016202411270422", "ultimo_uso": "2026-02-20", "ingresos": 28540, "transacciones": 65, "promedio": 439.0769230769231, "dias_sin_uso": 3}, {"cliente": "Empire Fitness San Martin", "num_term": 1, "terminal_id": "01610060202309270229", "ultimo_uso": "2026-01-15", "ingresos": 24751, "transacciones": 28, "promedio": 883.9642857142857, "dias_sin_uso": 39}, {"cliente": "PADEL WORLD", "num_term": 2, "terminal_id": "01610016202411270606", "ultimo_uso": "2026-02-19", "ingresos": 23570, "transacciones": 56, "promedio": 420.89285714285717, "dias_sin_uso": 4}, {"cliente": "FEDEDOME", "num_term": 1, "terminal_id": "01610060202309270739", "ultimo_uso": "2026-01-29", "ingresos": 22868, "transacciones": 24, "promedio": 952.8333333333334, "dias_sin_uso": 25}, {"cliente": "Club PH Phonique", "num_term": 6, "terminal_id": "01610015202405211663", "ultimo_uso": "2026-02-05", "ingresos": 21628.010000000002, "transacciones": 11, "promedio": 1966.1827272727276, "dias_sin_uso": 18}, {"cliente": "SANTUARIO PIO", "num_term": 2, "terminal_id": "01610060202309271259", "ultimo_uso": "2026-02-18", "ingresos": 20955, "transacciones": 26, "promedio": 805.9615384615385, "dias_sin_uso": 5}, {"cliente": "Wallfine", "num_term": 1, "terminal_id": "01610050202309050270", "ultimo_uso": "", "ingresos": 18501.15, "transacciones": 3, "promedio": 6167.05, "dias_sin_uso": 4}, {"cliente": "Hacienda Soleil", "num_term": 1, "terminal_id": "01610060202309270652", "ultimo_uso": "2026-02-19", "ingresos": 17802.199999999997, "transacciones": 14, "promedio": 1271.5857142857142, "dias_sin_uso": 4}, {"cliente": "MONTAJES OPERATIVOS", "num_term": 1, "terminal_id": "01610060202309270142", "ultimo_uso": "2026-02-19", "ingresos": 17470.22, "transacciones": 250, "promedio": 69.88088, "dias_sin_uso": 4}, {"cliente": "COCINA MONTEJO", "num_term": 1, "terminal_id": "01610015202405211098", "ultimo_uso": "2026-01-20", "ingresos": 15992, "transacciones": 8, "promedio": 1999, "dias_sin_uso": 34}, {"cliente": "ELEVEN PEOPLE", "num_term": 3, "terminal_id": "01610015202405211660", "ultimo_uso": "2026-02-20", "ingresos": 15186, "transacciones": 5, "promedio": 3037.2, "dias_sin_uso": 3}, {"cliente": "Box Box Car Service ", "num_term": 1, "terminal_id": "01610050202309050002", "ultimo_uso": "2026-02-19", "ingresos": 14198.39, "transacciones": 5, "promedio": 2839.678, "dias_sin_uso": 4}, {"cliente": "DR FELIX URBINA", "num_term": 1, "terminal_id": "01610060202309270724", "ultimo_uso": "2026-02-19", "ingresos": 12300, "transacciones": 14, "promedio": 878.5714285714286, "dias_sin_uso": 4}, {"cliente": "CONSULTA MEDICA DU", "num_term": 1, "terminal_id": "01610015202405212175", "ultimo_uso": "2026-02-19", "ingresos": 11800, "transacciones": 9, "promedio": 1311.111111111111, "dias_sin_uso": 4}, {"cliente": "Bar La Oficina", "num_term": 1, "terminal_id": "01610016202411271135", "ultimo_uso": "2026-01-23", "ingresos": 11101, "transacciones": 23, "promedio": 482.6521739130435, "dias_sin_uso": 31}, {"cliente": "Frans Automotive", "num_term": 1, "terminal_id": "01610016202411270793", "ultimo_uso": "2026-02-05", "ingresos": 10710, "transacciones": 6, "promedio": 1785, "dias_sin_uso": 18}, {"cliente": "DR JESUS PONCE ONCOPEDIA", "num_term": 1, "terminal_id": "01610015202405210011", "ultimo_uso": "2026-02-19", "ingresos": 10300, "transacciones": 7, "promedio": 1471.4285714285713, "dias_sin_uso": 4}, {"cliente": "Quesos Chiapas", "num_term": 1, "terminal_id": "01610060202309270236", "ultimo_uso": "2026-02-07", "ingresos": 9662, "transacciones": 5, "promedio": 1932.4, "dias_sin_uso": 16}, {"cliente": "Centro Joyero Centenario", "num_term": 1, "terminal_id": "01610016202411271092", "ultimo_uso": "2026-02-03", "ingresos": 9378, "transacciones": 2, "promedio": 4689, "dias_sin_uso": 20}, {"cliente": "UROLOGIA FUNCIONAL", "num_term": 1, "terminal_id": "01610015202405210942", "ultimo_uso": "", "ingresos": 9000, "transacciones": 12, "promedio": 750, "dias_sin_uso": 42}, {"cliente": "Quesos Chiapas 2 ", "num_term": 1, "terminal_id": "01610015202405211039", "ultimo_uso": "2026-02-23", "ingresos": 7489, "transacciones": 19, "promedio": 394.1578947368421, "dias_sin_uso": 0}, {"cliente": "AJEDREZ", "num_term": 1, "terminal_id": "-", "ultimo_uso": "2026-02-04", "ingresos": 7180, "transacciones": 4, "promedio": 1795, "dias_sin_uso": 19}, {"cliente": "Potato Shop", "num_term": 1, "terminal_id": "-", "ultimo_uso": "2026-02-04", "ingresos": 7000, "transacciones": 2, "promedio": 3500, "dias_sin_uso": 19}, {"cliente": "Hotel Casa Real ", "num_term": 1, "terminal_id": "01610060202309270858", "ultimo_uso": "2026-02-19", "ingresos": 6925, "transacciones": 11, "promedio": 629.5454545454545, "dias_sin_uso": 4}, {"cliente": "BLACKHAWK", "num_term": 1, "terminal_id": "01610015202405211052", "ultimo_uso": "2026-02-19", "ingresos": 6680, "transacciones": 14, "promedio": 477.14285714285717, "dias_sin_uso": 4}, {"cliente": "ANTOJO GULA", "num_term": 1, "terminal_id": "01610015202405211073", "ultimo_uso": "2026-02-19", "ingresos": 6639.5, "transacciones": 41, "promedio": 161.9390243902439, "dias_sin_uso": 4}, {"cliente": "Playa Kaleta Restaurante", "num_term": 1, "terminal_id": "01610016202411270863", "ultimo_uso": "2026-02-01", "ingresos": 6440.700000000001, "transacciones": 6, "promedio": 1073.45, "dias_sin_uso": 22}, {"cliente": "Manik Odontologia", "num_term": 1, "terminal_id": "01610015202405211429", "ultimo_uso": "2026-02-19", "ingresos": 6250, "transacciones": 9, "promedio": 694.4444444444445, "dias_sin_uso": 4}, {"cliente": "Dr Rogelio Herrera Lima", "num_term": 1, "terminal_id": "01610015202405210908", "ultimo_uso": "2026-02-06", "ingresos": 5000, "transacciones": 1, "promedio": 5000, "dias_sin_uso": 17}, {"cliente": "OTORRINO LOMAS", "num_term": 1, "terminal_id": "01610060202309271292", "ultimo_uso": "2026-02-03", "ingresos": 4930, "transacciones": 1, "promedio": 4930, "dias_sin_uso": 20}, {"cliente": "Nutriment 11 sur", "num_term": 1, "terminal_id": "01610060202309270414", "ultimo_uso": "2026-02-19", "ingresos": 4734, "transacciones": 4, "promedio": 1183.5, "dias_sin_uso": 4}, {"cliente": "DENTALYSS CENTER", "num_term": 1, "terminal_id": "01610060202309270626", "ultimo_uso": "2026-02-18", "ingresos": 4500, "transacciones": 1, "promedio": 4500, "dias_sin_uso": 5}, {"cliente": "Hotel Casa Real", "num_term": 1, "terminal_id": "01610060202309270858", "ultimo_uso": "2026-02-05", "ingresos": 3970, "transacciones": 15, "promedio": 264.6666666666667, "dias_sin_uso": 18}, {"cliente": "Iglesia Cristiana", "num_term": 1, "terminal_id": "01610016202411270987", "ultimo_uso": "2026-02-19", "ingresos": 3913, "transacciones": 37, "promedio": 105.75675675675676, "dias_sin_uso": 4}, {"cliente": "ONOLOA POKE HOUSE", "num_term": 1, "terminal_id": "01610060202309271128", "ultimo_uso": "2026-01-16", "ingresos": 1844.5, "transacciones": 7, "promedio": 263.5, "dias_sin_uso": 38}, {"cliente": "Ferba Sports ", "num_term": 1, "terminal_id": "01610060202309270740", "ultimo_uso": "2026-02-11", "ingresos": 500, "transacciones": 2, "promedio": 250, "dias_sin_uso": 12}, {"cliente": "FRESH SOLUTIONS", "num_term": 1, "terminal_id": "01610015202405211657", "ultimo_uso": "2026-01-23", "ingresos": 500, "transacciones": 1, "promedio": 500, "dias_sin_uso": 31}, {"cliente": "La Calle", "num_term": 1, "terminal_id": "01610016202411271924", "ultimo_uso": "2026-02-12", "ingresos": 200, "transacciones": 1, "promedio": 200, "dias_sin_uso": 11}, {"cliente": "PadelMatch", "num_term": 1, "terminal_id": "-", "ultimo_uso": "2026-02-12", "ingresos": 80, "transacciones": 16, "promedio": 5, "dias_sin_uso": 11}, {"cliente": "Ferba Sports", "num_term": 1, "terminal_id": "01610060202309270740", "ultimo_uso": "2026-02-04", "ingresos": 50, "transacciones": 1, "promedio": 50, "dias_sin_uso": 19}, {"cliente": "7 Cielos", "num_term": 1, "terminal_id": "01610015202405211514", "ultimo_uso": "2026-01-28", "ingresos": 30, "transacciones": 3, "promedio": 10, "dias_sin_uso": 26}, {"cliente": "Rest B", "num_term": 1, "terminal_id": "01610060202309271429", "ultimo_uso": "2026-01-20", "ingresos": 20, "transacciones": 4, "promedio": 5, "dias_sin_uso": 34}, {"cliente": "Centum Cabo", "num_term": 1, "terminal_id": "01610015202405211483", "ultimo_uso": "2026-01-19", "ingresos": 11, "transacciones": 1, "promedio": 11, "dias_sin_uso": 35}, {"cliente": "Amo Tulum Tours", "num_term": 2, "terminal_id": "-", "ultimo_uso": "2026-01-28", "ingresos": 10, "transacciones": 1, "promedio": 10, "dias_sin_uso": 26}, {"cliente": "La Ruta De Las Indias SF", "num_term": 1, "terminal_id": "01610015202405210271", "ultimo_uso": "2026-02-14", "ingresos": 10, "transacciones": 1, "promedio": 10, "dias_sin_uso": 9}, {"cliente": "Focca", "num_term": 1, "terminal_id": "01610015202405212264", "ultimo_uso": "2026-01-23", "ingresos": 1, "transacciones": 1, "promedio": 1, "dias_sin_uso": 31}, {"cliente": "Poch del Huach Centro", "num_term": 1, "terminal_id": "01610015202405210951", "ultimo_uso": "2026-01-20", "ingresos": 1, "transacciones": 1, "promedio": 1, "dias_sin_uso": 34}, {"cliente": "SANTO CHANCHO", "num_term": 1, "terminal_id": "01610060202309270840", "ultimo_uso": "2026-01-14", "ingresos": 1, "transacciones": 1, "promedio": 1, "dias_sin_uso": 40}, {"cliente": "Viajes CEUNI", "num_term": 2, "terminal_id": "01610060202309270832", "ultimo_uso": "", "ingresos": 1, "transacciones": 1, "promedio": 1, "dias_sin_uso": 33}, {"cliente": "WICHO", "num_term": 1, "terminal_id": "01610016202411270426", "ultimo_uso": "", "ingresos": 1, "transacciones": 2, "promedio": 0.5, "dias_sin_uso": 31}, {"cliente": "JPART", "num_term": 1, "terminal_id": "01610060202309270501", "ultimo_uso": "2026-02-04", "ingresos": 0.02, "transacciones": 2, "promedio": 0.01, "dias_sin_uso": 19}, {"cliente": "Tony2", "num_term": 2, "terminal_id": "01610015202405211529", "ultimo_uso": "2026-01-23", "ingresos": 0.01, "transacciones": 1, "promedio": 0.01, "dias_sin_uso": 31}, {"cliente": "Centum Capital", "num_term": 2, "terminal_id": "01610015202405211525", "ultimo_uso": "2026-01-15", "ingresos": 0, "transacciones": 2, "promedio": 0, "dias_sin_uso": 39}, {"cliente": "Opulance Cabo", "num_term": 1, "terminal_id": "01610015202405211015", "ultimo_uso": "2026-02-09", "ingresos": 0, "transacciones": 2, "promedio": 0, "dias_sin_uso": 14}];
const TPV_CAMBIOS     = [{"num": 1, "terminal": "01610015202405211076", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 35, "monto_ant": 27063, "tipo": "⚠️ Solapamiento", "cliente_act": "Del Valle", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-01-22", "txns_act": 210}, {"num": 2, "terminal": "01610015202405211296", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-17", "txns_ant": 21, "monto_ant": 90555, "tipo": "⚠️ Solapamiento", "cliente_act": "Del Valle", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-01-26", "txns_act": 193}, {"num": 3, "terminal": "01610015202405211508", "cliente_ant": "Mexico Handmade", "fecha_ant_ini": "2026-01-09", "fecha_ant_fin": "2026-01-13", "txns_ant": 16, "monto_ant": 110125, "tipo": "⚠️ Solapamiento", "cliente_act": "Constructora Brumo", "fecha_act_ini": "2026-01-12", "fecha_act_fin": "2026-02-02", "txns_act": 9}, {"num": 4, "terminal": "01610015202405211522", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 8, "monto_ant": 2692.5, "tipo": "⚠️ Solapamiento", "cliente_act": "C CUMBRES", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-02-11", "txns_act": 440}, {"num": 5, "terminal": "01610015202405211525", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-16", "fecha_ant_fin": "2026-01-18", "txns_ant": 9, "monto_ant": 3330, "tipo": "⚠️ Solapamiento", "cliente_act": "C CUMBRES", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-02-10", "txns_act": 883}, {"num": 6, "terminal": "01610015202405211599", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 22, "monto_ant": 28770, "tipo": "⚠️ Solapamiento", "cliente_act": "C CUMBRES", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-02-09", "txns_act": 644}, {"num": 7, "terminal": "01610050202309050195", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 126, "monto_ant": 95687, "tipo": "⚠️ Solapamiento", "cliente_act": "C CUMBRES", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-02-09", "txns_act": 1789}, {"num": 8, "terminal": "01610050202309050271", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 61, "monto_ant": 37795, "tipo": "⚠️ Solapamiento", "cliente_act": "C CUMBRES", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-02-08", "txns_act": 1723}, {"num": 9, "terminal": "01610060202309270501", "cliente_ant": "Luna Canela", "fecha_ant_ini": "2026-01-01", "fecha_ant_fin": "2026-02-04", "txns_ant": 24, "monto_ant": 51113.2, "tipo": "⚠️ Solapamiento", "cliente_act": "JPART", "fecha_act_ini": "2026-02-04", "fecha_act_fin": "2026-02-04", "txns_act": 2}, {"num": 10, "terminal": "01610060202309271247", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 145, "monto_ant": 97544, "tipo": "⚠️ Solapamiento", "cliente_act": "C CUMBRES", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-02-09", "txns_act": 2139}, {"num": 11, "terminal": "01610060202309271429", "cliente_ant": "Rest B", "fecha_ant_ini": "2026-01-14", "fecha_ant_fin": "2026-01-20", "txns_ant": 4, "monto_ant": 20, "tipo": "⚠️ Solapamiento", "cliente_act": "Viajes CEUNI", "fecha_act_ini": "2026-01-19", "fecha_act_fin": "2026-01-21", "txns_act": 2}, {"num": 12, "terminal": "01610080202310110215", "cliente_ant": "FOCACCIA", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-16", "txns_ant": 26, "monto_ant": 21784, "tipo": "⚠️ Solapamiento", "cliente_act": "Del Valle", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-01-22", "txns_act": 260}, {"num": 13, "terminal": "01610015202405211085", "cliente_ant": "Tony2", "fecha_ant_ini": "2026-01-23", "fecha_ant_fin": "2026-01-23", "txns_ant": 1, "monto_ant": 1.1, "tipo": "✅ Limpio", "cliente_act": "Club PH Phonique", "fecha_act_ini": "2026-01-30", "fecha_act_fin": "2026-02-08", "txns_act": 6}, {"num": 14, "terminal": "01610015202405211098", "cliente_ant": "COCINA MONTEJO", "fecha_ant_ini": "2026-01-07", "fecha_ant_fin": "2026-01-20", "txns_ant": 8, "monto_ant": 15992, "tipo": "✅ Limpio", "cliente_act": "MJ", "fecha_act_ini": "2026-01-21", "fecha_act_fin": "2026-02-07", "txns_act": 81}, {"num": 15, "terminal": "01610015202405211525", "cliente_ant": "Centum Capital", "fecha_ant_ini": "2026-01-15", "fecha_ant_fin": "2026-01-15", "txns_ant": 2, "monto_ant": 0, "tipo": "✅ Limpio", "cliente_act": "FOCACCIA", "fecha_act_ini": "2026-01-16", "fecha_act_fin": "2026-01-18", "txns_act": 9}, {"num": 16, "terminal": "01610060202309270015", "cliente_ant": "Luna Canela", "fecha_ant_ini": "2026-01-07", "fecha_ant_fin": "2026-01-29", "txns_ant": 7, "monto_ant": 3.24, "tipo": "✅ Limpio", "cliente_act": "Mt Mechanics", "fecha_act_ini": "2026-02-02", "fecha_act_fin": "2026-02-07", "txns_act": 8}, {"num": 17, "terminal": "01610060202309270414", "cliente_ant": "Empire Fitness Cholula", "fecha_ant_ini": "2025-12-31", "fecha_ant_fin": "2026-01-15", "txns_ant": 423, "monto_ant": 251316, "tipo": "✅ Limpio", "cliente_act": "Nutriment 11 sur", "fecha_act_ini": "2026-02-05", "fecha_act_fin": "2026-02-06", "txns_act": 4}];

function fmtTPV(n){n=parseFloat(n)||0;if(Math.abs(n)>=1e6)return'$'+(n/1e6).toFixed(1)+'M';if(Math.abs(n)>=1000)return'$'+(n/1000).toFixed(0)+'K';return'$'+n.toFixed(0);}
function fmtTPVFull(n,d=0){return n?'$'+parseFloat(n).toLocaleString('es-MX',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';}

// Cache for pagos modal functions (populated in rTPVPagos)
let _tpvPagosCache = [];
let _termAllData = []; // cache for terminal filter

function filterTPVTable(tbodyId,q){
  document.getElementById(tbodyId).querySelectorAll('tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q.toLowerCase())?'':'none';});
}

// ── Generic search-to-dropdown helper ──
// Filters a <select> options by text query, auto-selects + triggers change on single match
function _filterSelectOptions(selectId, allOptions, query, defaultLabel) {
  const sel = document.getElementById(selectId); if (!sel) return;
  const q = (query || '').toLowerCase().trim();
  sel.innerHTML = `<option value="">${defaultLabel}</option>`;
  const filtered = q ? allOptions.filter(o => o.label.toLowerCase().includes(q)) : allOptions;
  filtered.forEach(o => { sel.innerHTML += `<option value="${o.value}">${o.label}</option>`; });
  if (filtered.length === 1) {
    sel.value = filtered[0].value;
    sel.dispatchEvent(new Event('change'));
  }
}

// Cached option lists (populated by render functions)
let _termClienteOptions = [];
let _agenteOptions = [];
let _pagoClienteAllOptions = [];
let _pagoAgenteAllOptions = [];

// Search filters for each dropdown
function filterTermClienteOptions(q) { _filterSelectOptions('term-cliente-filter', _termClienteOptions, q, 'Todos los clientes'); }
function filterAgenteOptions(q) { _filterSelectOptions('agente-filter', _agenteOptions, q, 'Todos los agentes'); }
function filterPagoClienteOptions(q) { _filterSelectOptions('pago-cliente-sel', _pagoClienteAllOptions, q, '— Seleccionar cliente —'); }
function filterPagoAgenteOptions(q) { _filterSelectOptions('pago-agente-sel', _pagoAgenteAllOptions, q, '— Seleccionar agente —'); }

// Filter terminales: show all or client-specific breakdown
async function filterTerminalesByCliente() {
  const sel = document.getElementById('term-cliente-filter');
  const clienteFilter = sel ? sel.value : '';

  if (!clienteFilter) {
    // Restore full terminal view
    rTPVTerminales();
    return;
  }

  const filtered = _termAllData.filter(t => t.cliente === clienteFilter);
  const tbody = document.getElementById('term-tbody');
  if (!tbody) return;

  // Fetch commission data for this client
  const comData = await TPV.clientCommissions() || [];
  const clientCom = comData.find(c => c.cliente === clienteFilter);
  const totalCobrado = clientCom ? parseFloat(clientCom.total_cobrado) || 0 : 0;
  const comSalem = clientCom ? parseFloat(clientCom.com_salem) || 0 : 0;
  const comTotal = clientCom ? parseFloat(clientCom.monto_neto) || 0 : 0;

  // KPIs for this client
  const numTerm = filtered.length;
  const totIng = filtered.reduce((s, t) => s + parseFloat(t.ingresos || 0), 0);
  const totTxn = filtered.reduce((s, t) => s + parseInt(t.transacciones || 0), 0);
  const activas = filtered.filter(t => (parseInt(t.dias_sin_uso) || 0) <= 14).length;
  const inactivas = filtered.filter(t => (parseInt(t.dias_sin_uso) || 0) > 30).length;

  const kEl = document.getElementById('tpv-term-kpis');
  if (kEl) kEl.innerHTML = `
    <div class="kpi-card" style="--ac:#0073ea"><div class="kpi-top"><div class="kpi-lbl">Terminales</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">🖥️</div></div><div class="kpi-val" style="color:#0073ea">${numTerm}</div><div class="kpi-d dnu"><span style="color:var(--green)">${activas} activas</span> · <span style="color:var(--red)">${inactivas} inact.</span></div><div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">Total Cobrado</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💰</div></div><div class="kpi-val" style="color:var(--green)">${fmtTPV(totalCobrado)}</div><div class="kpi-d dnu">${totTxn.toLocaleString()} transacciones</div><div class="kbar"><div class="kfill" style="background:var(--green);width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--purple)"><div class="kpi-top"><div class="kpi-lbl">Com. Salem</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">🏦</div></div><div class="kpi-val" style="color:var(--purple)">${fmtTPV(comSalem)}</div><div class="kpi-d dnu">Comisión Salem</div><div class="kbar"><div class="kfill" style="background:var(--purple);width:${totalCobrado > 0 ? Math.min(comSalem / totalCobrado * 100, 100).toFixed(0) : 0}%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--orange)"><div class="kpi-top"><div class="kpi-lbl">Total Comisiones</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">📊</div></div><div class="kpi-val" style="color:var(--orange)">${fmtTPV(comTotal)}</div><div class="kpi-d dnu">${totalCobrado > 0 ? (comTotal / totalCobrado * 100).toFixed(1) : '0.0'}% del cobrado</div><div class="kbar"><div class="kfill" style="background:var(--orange);width:${totalCobrado > 0 ? Math.min(comTotal / totalCobrado * 100, 100).toFixed(0) : 0}%"></div></div></div>`;

  // Update subtitle
  const sub = document.getElementById('tpv-term-subtitle');
  if (sub) sub.innerHTML = `<b>${clienteFilter}</b> · ${numTerm} terminales · <span style="color:var(--green);font-weight:600">${activas} activas</span> · <span style="color:var(--red)">${inactivas} inactivas</span>`;

  // Render terminal rows
  tbody.innerHTML = filtered.map(t => {
    const dias = parseInt(t.dias_sin_uso) || 0;
    const badge = dias <= 14 ? '<span class="tpv-badge-ok">Activa</span>' : dias <= 30 ? `<span class="tpv-badge-warn">${dias}d sin uso</span>` : `<span class="tpv-badge-inact">Inactiva ${dias}d</span>`;
    const tid = t.terminal_id && t.terminal_id !== '-' && t.terminal_id !== 'None' ? `<span style="font-family:monospace;font-size:.67rem;color:var(--muted)">${t.terminal_id.slice(-10)}</span>` : '—';
    return `<tr>
      <td>${tid}</td>
      <td class="mo pos bld">${parseFloat(t.ingresos) > 0 ? fmtTPVFull(t.ingresos) : '—'}</td>
      <td class="mo" style="text-align:center">${parseInt(t.transacciones) > 0 ? parseInt(t.transacciones).toLocaleString() : '—'}</td>
      <td class="mo">${parseFloat(t.promedio) > 0 ? '$' + parseFloat(t.promedio).toFixed(0) : '—'}</td>
      <td style="font-size:.73rem">${t.ultimo_uso || '—'}</td>
      <td class="mo" style="text-align:center;color:${dias > 30 ? 'var(--red)' : dias > 14 ? 'var(--orange)' : 'var(--green)'}">${dias || '—'}</td>
      <td>${badge}</td></tr>`;
  }).join('');

  // Update table header for client detail
  const thead = document.querySelector('#view-tpv_terminales .bt thead tr');
  if (thead) thead.innerHTML = '<th>Terminal ID</th><th class="r">Ingresos</th><th class="r">Txns</th><th class="r">Prom/Txn</th><th>Último Uso</th><th class="r">Días Sin Uso</th><th>Estado</th>';

  // Update charts for this client
  setTimeout(() => {
    const isDark = document.body.classList.contains('dark');
    const textC = isDark ? '#9da0c5' : '#8b8fb5';
    const gridC = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
    // Bar chart: ingresos per terminal
    const sorted = [...filtered].sort((a, b) => parseFloat(b.ingresos || 0) - parseFloat(a.ingresos || 0)).slice(0, 10);
    if (TPV_CHARTS['term_top']) TPV_CHARTS['term_top'].destroy();
    const c1 = document.getElementById('c-tpv-term-top');
    if (c1) {
      TPV_CHARTS['term_top'] = new Chart(c1, { type: 'bar',
        data: { labels: sorted.map(t => t.terminal_id ? t.terminal_id.slice(-8) : '—'), datasets: [{ data: sorted.map(t => parseFloat(t.ingresos)), backgroundColor: '#0073ea22', borderColor: '#0073ea', borderWidth: 1.5, borderRadius: 4 }] },
        options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: gridC }, ticks: { color: textC, font: { size: 9 }, callback: v => v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'K' : '$' + v } }, y: { grid: { display: false }, ticks: { color: textC, font: { size: 8 } } } } }
      });
    }
    // Doughnut: active vs inactive for this client
    if (TPV_CHARTS['term_status']) TPV_CHARTS['term_status'].destroy();
    const c2 = document.getElementById('c-tpv-term-status');
    const warning = filtered.filter(t => { const d = parseInt(t.dias_sin_uso) || 0; return d > 14 && d <= 30; }).length;
    if (c2) {
      TPV_CHARTS['term_status'] = new Chart(c2, { type: 'doughnut',
        data: { labels: ['Activas', 'Alerta', 'Inactivas'], datasets: [{ data: [activas, warning, inactivas], backgroundColor: ['#00b875', '#ffa000', '#e53935'], borderWidth: 0 }] },
        options: { cutout: '65%', plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, color: textC, boxWidth: 10, padding: 8 } } } }
      });
    }
  }, 50);
}

// Filter agentes: show all agents or client breakdown for specific agent
async function filterAgentesBySelect() {
  const sel = document.getElementById('agente-filter');
  const selectedId = sel ? sel.value : '';

  if (!selectedId) {
    // Restore full agent view
    rTPVAgentes();
    return;
  }

  // Find agent in cache
  const ag = _agentesCache.find(a => String(a.agente_id) === selectedId);
  if (!ag) return;

  const pct = parseFloat(ag.pct || 0);

  // Fetch client data in parallel
  const [allClients, comData] = await Promise.all([
    TPV.getClients(),
    TPV.clientCommissions()
  ]);

  // Get client IDs belonging to this agent
  const agentClientIds = (allClients || [])
    .filter(c => c.agente_id === parseInt(selectedId))
    .map(c => c.id);

  // Filter commissions for this agent's clients
  const clientRows = (comData || [])
    .filter(c => agentClientIds.includes(c.client_id))
    .map(c => {
      const cobrado = parseFloat(c.total_cobrado) || 0;
      const comSalem = parseFloat(c.com_salem) || 0;
      const comAgente = comSalem * pct;
      return { ...c, _cobrado: cobrado, _comSalem: comSalem, _comAgente: comAgente };
    })
    .sort((a, b) => b._cobrado - a._cobrado);

  // Totals
  const totCobrado = clientRows.reduce((s, c) => s + c._cobrado, 0);
  const totComSalem = clientRows.reduce((s, c) => s + c._comSalem, 0);
  const totComAgente = clientRows.reduce((s, c) => s + c._comAgente, 0);
  const pagado = agenteTotalPagado(ag.agente_id);
  const pendiente = Math.max(0, totComAgente - pagado);

  // Update subtitle
  const sub = document.getElementById('agentes-subtitle');
  if (sub) sub.innerHTML = `<b>${escapeHtml(ag.agente)} (${escapeHtml(ag.siglas)})</b> · ${clientRows.length} clientes · Com. ${(pct * 100).toFixed(0)}% sobre Salem · <span style="color:var(--green);font-weight:600">Pagado ${fmtTPV(pagado)}</span>`;

  // Update KPIs
  const kEl = document.getElementById('agentes-kpis');
  if (kEl) kEl.innerHTML = `
    <div class="kpi-card" style="--ac:#0073ea"><div class="kpi-top"><div class="kpi-lbl">Monto Cobrado</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">💰</div></div><div class="kpi-val" style="color:#0073ea">${fmtTPV(totCobrado)}</div><div class="kpi-d dnu">${clientRows.length} clientes del agente</div><div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">Com. Salem</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">🏦</div></div><div class="kpi-val" style="color:var(--green)">${fmtTPV(totComSalem)}</div><div class="kpi-d dnu">Comisión generada para Salem</div><div class="kbar"><div class="kfill" style="background:var(--green);width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--orange)"><div class="kpi-top"><div class="kpi-lbl">Com. ${escapeHtml(ag.siglas)}</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">📈</div></div><div class="kpi-val" style="color:var(--orange)">${fmtTPV(totComAgente)}</div><div class="kpi-d dnu">${(pct * 100).toFixed(0)}% de Com. Salem</div><div class="kbar"><div class="kfill" style="background:var(--orange);width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--red)"><div class="kpi-top"><div class="kpi-lbl">Pendiente Pago</div><div class="kpi-ico" style="background:var(--red-bg);color:var(--red)">⏳</div></div><div class="kpi-val" style="color:var(--red)">${fmtTPV(pendiente)}</div><div class="kpi-d dnu">Pagado: ${fmtTPV(pagado)}</div><div class="kbar"><div class="kfill" style="background:var(--red);width:${totComAgente > 0 ? Math.min(pendiente / totComAgente * 100, 100).toFixed(0) : 0}%"></div></div></div>`;

  // Update table header
  const theadRow = document.getElementById('agentes-thead');
  if (theadRow) theadRow.innerHTML = '<th>#</th><th>Cliente</th><th class="r">Monto Cobrado</th><th class="r">Com. Salem</th><th class="r" style="color:var(--orange)">Com. ' + escapeHtml(ag.siglas) + '</th><th class="r">% del Total</th>';

  // Render client rows
  const tbody = document.getElementById('agentes-tbody');
  if (tbody) {
    if (clientRows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted);font-size:.8rem">Este agente no tiene clientes con transacciones registradas.</td></tr>';
    } else {
      tbody.innerHTML = clientRows.map((c, i) => {
        const pctTotal = totCobrado > 0 ? (c._cobrado / totCobrado * 100).toFixed(1) : '0.0';
        return `<tr>
          <td style="color:var(--muted);font-size:.72rem">${i + 1}</td>
          <td class="bld">${escapeHtml(c.cliente)}</td>
          <td class="mo pos bld">${fmtTPVFull(c._cobrado)}</td>
          <td class="mo">${fmtTPVFull(c._comSalem)}</td>
          <td class="mo" style="color:var(--orange);font-weight:600">${fmtTPVFull(c._comAgente)}</td>
          <td class="mo">${pctTotal}%</td></tr>`;
      }).join('');
    }
  }

  // Update table title
  const tableTitle = document.getElementById('agentes-table-title');
  if (tableTitle) tableTitle.textContent = `Clientes de ${ag.agente} (${ag.siglas})`;
  const chartTitle = document.getElementById('agentes-chart-title');
  if (chartTitle) chartTitle.textContent = `Clientes de ${ag.siglas}`;
  const chartSub = document.getElementById('agentes-chart-sub');
  if (chartSub) chartSub.textContent = `Cobrado vs Com. ${ag.siglas}`;

  // Update chart: top clients by cobrado
  setTimeout(() => {
    const isDark = document.body.classList.contains('dark');
    const textC = isDark ? '#9da0c5' : '#8b8fb5';
    const gridC = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
    const top10 = clientRows.slice(0, 10);
    if (TPV_CHARTS['agentes']) TPV_CHARTS['agentes'].destroy();
    const canvas = document.getElementById('c-tpv-agentes'); if (!canvas) return;
    TPV_CHARTS['agentes'] = new Chart(canvas, { type: 'bar',
      data: { labels: top10.map(c => (c.cliente || '').substring(0, 18)), datasets: [
        { label: 'Cobrado', data: top10.map(c => c._cobrado), backgroundColor: '#0073ea22', borderColor: '#0073ea', borderWidth: 1.5, borderRadius: 4 },
        { label: 'Com. ' + ag.siglas, data: top10.map(c => c._comAgente), backgroundColor: '#ff704322', borderColor: '#ff7043', borderWidth: 1.5, borderRadius: 4 }
      ]},
      options: { indexAxis: 'y', plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, color: textC, boxWidth: 10 } } }, scales: {
        x: { grid: { color: gridC }, ticks: { color: textC, font: { size: 9 }, callback: v => v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'K' : '$' + v } },
        y: { grid: { display: false }, ticks: { color: textC, font: { size: 8 } } }
      }}
    });
  }, 50);
}

function _renderClientTable(id, arr) {
  const el = document.getElementById(id); if (!el) return;
  el.innerHTML = arr.map((c, i) => `<tr>
    <td style="color:var(--muted);font-size:.72rem">${i + 1}</td>
    <td class="bld">${c.cliente}</td>
    <td class="mo">${c.monto_tc > 0 ? fmtTPVFull(c.monto_tc) : '—'}</td>
    <td class="mo">${c.monto_td > 0 ? fmtTPVFull(c.monto_td) : '—'}</td>
    <td class="mo">${c.monto_amex > 0 ? fmtTPVFull(c.monto_amex) : '—'}</td>
    <td class="mo bld pos">${fmtTPVFull(c.total)}</td></tr>`).join('');
}

function _renderKpis(containerId, kpis, mix, clickable) {
  const el = document.getElementById(containerId); if (!el) return;
  const k = kpis || {};
  const totalCom = parseFloat(k.total_comisiones) || 0;
  const totalCob = parseFloat(k.total_cobrado) || 1;
  const pctCom = (totalCom / totalCob * 100).toFixed(1);
  const comSalem = parseFloat(k.com_salem) || 0;
  const comEfevoo = parseFloat(k.com_efevoo) || 0;
  const pctSalem = totalCom > 0 ? (comSalem / totalCom * 100).toFixed(1) : '0.0';
  const pctEfevoo = totalCom > 0 ? (comEfevoo / totalCom * 100).toFixed(1) : '0.0';
  el.innerHTML = `
    <div class="kpi-card ${clickable ? 'kpi-clickable' : ''}" style="--ac:#0073ea" ${clickable ? "onclick=\"sv('tpv_dashboard',null)\"" : ''}>
      ${clickable ? '<div class="kpi-hint">ver período →</div>' : ''}
      <div class="kpi-top"><div class="kpi-lbl">Total Cobrado</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">💰</div></div>
      <div class="kpi-val" style="color:#0073ea">${fmtTPV(k.total_cobrado)}</div>
      <div class="kpi-d dnu">${k.num_transacciones ? parseFloat(k.num_transacciones).toLocaleString() + ' transacciones' : ''}</div>
      <div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div>
    </div>
    <div class="kpi-card ${clickable ? 'kpi-clickable' : ''}" style="--ac:var(--green)" ${clickable ? "onclick=\"openTopComisiones()\"" : ''}>
      ${clickable ? '<div class="kpi-hint">ver top 10 →</div>' : ''}
      <div class="kpi-top"><div class="kpi-lbl">Total Comisiones</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">📈</div></div>
      <div class="kpi-val" style="color:var(--green)">${fmtTPV(totalCom)}</div>
      <div class="kpi-d dup">${pctCom}% del cobrado</div>
      <div class="kbar"><div class="kfill" style="background:var(--green);width:${Math.min(parseFloat(pctCom), 100)}%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:#0073ea">
      <div class="kpi-top"><div class="kpi-lbl">Com. Salem</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">🏦</div></div>
      <div class="kpi-val" style="color:#0073ea">${fmtTPV(comSalem)}</div>
      <div class="kpi-d dnu">${pctSalem}% de comisiones</div>
      <div class="kbar"><div class="kfill" style="background:#0073ea;width:${pctSalem}%"></div></div>
    </div>
    <div class="kpi-card ${clickable ? 'kpi-clickable' : ''}" style="--ac:var(--purple)" ${clickable ? "onclick=\"sv('tpv_agentes',null)\"" : ''}>
      ${clickable ? '<div class="kpi-hint">ver agentes →</div>' : ''}
      <div class="kpi-top"><div class="kpi-lbl">${clickable ? 'Clientes Activos' : 'Com. Efevoo'}</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">${clickable ? '🏪' : '⚡'}</div></div>
      <div class="kpi-val" style="color:var(--purple)">${clickable ? (k.num_clientes || 0) : fmtTPV(comEfevoo)}</div>
      <div class="kpi-d dnu">${clickable ? 'Com. Efevoo ' + fmtTPV(comEfevoo) : pctEfevoo + '% del total'}</div>
      <div class="kbar"><div class="kfill" style="background:var(--purple);width:${clickable ? '100' : pctEfevoo}%"></div></div>
    </div>`;
}

function _renderCharts(topKey, pieKey, clients, mix, barColor) {
  const isDark = document.body.classList.contains('dark');
  const gridC = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const textC = isDark ? '#9da0c5' : '#8b8fb5';
  const top10 = (clients || []).slice(0, 10);
  const canvasTop = document.getElementById(topKey === 'top10' ? 'c-tpv-top10' : 'c-tpv-dd-top');
  const canvasPie = document.getElementById(topKey === 'top10' ? 'c-tpv-com-pie' : 'c-tpv-dd-pie');

  if (TPV_CHARTS[topKey]) TPV_CHARTS[topKey].destroy();
  if (canvasTop) {
    TPV_CHARTS[topKey] = new Chart(canvasTop, {
      type: 'bar',
      data: { labels: top10.map(c => c.cliente.substring(0, 18)), datasets: [{ data: top10.map(c => parseFloat(c.total)), backgroundColor: barColor + '22', borderColor: barColor, borderWidth: 1.5, borderRadius: 4 }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: {
        x: { grid: { color: gridC }, ticks: { color: textC, font: { size: 9 }, callback: v => v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'K' : '$' + v } },
        y: { grid: { display: false }, ticks: { color: textC, font: { size: 9 } } }
      }}
    });
  }

  if (TPV_CHARTS[pieKey]) TPV_CHARTS[pieKey].destroy();
  if (canvasPie && mix && mix.length) {
    TPV_CHARTS[pieKey] = new Chart(canvasPie, {
      type: 'doughnut',
      data: { labels: mix.map(m => m.entity), datasets: [{ data: mix.map(m => parseFloat(m.total_commission)), backgroundColor: ['#9b51e0', '#0073ea', '#ff7043', '#ffa000'], borderWidth: 0 }] },
      options: { cutout: '65%', plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, color: textC, boxWidth: 10, padding: 8 } } } }
    });
  }
}

async function initTPVGeneral() {
  const [clients, kpis, mix] = await Promise.all([
    TPV.clientsByVolume(), TPV.kpis(), TPV.commissionMix()
  ]);
  const k = kpis || {};
  const sub = document.getElementById('tpv-general-subtitle');
  if (sub) sub.innerHTML = `Análisis acumulado · Sin filtro de fechas · <span style="color:#0073ea;font-weight:600">${k.num_clientes || 0} clientes</span> · <span style="color:var(--green);font-weight:600">${(k.num_transacciones||0).toLocaleString()} txns</span>`;
  _renderClientTable('dg-tbody', clients || []);
  _renderKpis('tpv-general-kpis', k, mix, true);
  setTimeout(() => _renderCharts('top10', 'com_pie', clients, mix, '#0073ea'), 50);
}

async function initTPVDashboard(fromDate, toDate) {
  // Use provided dates or get from date pickers, default to current month
  const from = fromDate || document.getElementById('dash-from')?.value || (()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-01'})();
  const to = toDate || document.getElementById('dash-to')?.value || new Date().toISOString().slice(0,10);
  // Update date picker values
  const dfEl = document.getElementById('dash-from'); if(dfEl && !dfEl.value) dfEl.value = from;
  const dtEl = document.getElementById('dash-to'); if(dtEl && !dtEl.value) dtEl.value = to;
  const [clients, kpis, mix] = await Promise.all([
    TPV.clientsByVolume(from, to), TPV.kpis(from, to), TPV.commissionMix(from, to)
  ]);
  const k = kpis || {};
  const periodLabel = from && to ? `${from} → ${to}` : 'Histórico completo';
  const sub = document.getElementById('tpv-dashboard-subtitle');
  if (sub) sub.innerHTML = `Período: <span style="color:#0073ea;font-weight:600">${periodLabel}</span> · ${k.num_clientes || 0} clientes · ${(k.num_transacciones||0).toLocaleString()} txns`;
  // Update chart and table labels dynamically
  const chartPeriod = document.getElementById('dd-chart-period');
  if (chartPeriod) chartPeriod.textContent = periodLabel;
  const piePeriod = document.getElementById('dd-pie-period');
  if (piePeriod) piePeriod.textContent = periodLabel;
  const tableTitle = document.getElementById('dd-table-title');
  if (tableTitle) tableTitle.textContent = `Clientes — ${periodLabel}`;
  _renderClientTable('dd-tbody', clients || []);
  _renderKpis('tpv-dashboard-kpis', k, mix, false);
  setTimeout(() => _renderCharts('dd_top', 'dd_pie', clients, mix, '#00b875'), 50);

  // Calculate and render Salem monthly earnings
  const year = (from || to || new Date().toISOString()).slice(0, 4);
  TPV.calcMonthlyPL(year).then(plData => {
    _renderSalemEarnings(plData);
  }).catch(e => {
    console.warn('[TPV] Salem earnings calc failed:', e.message);
    _renderSalemEarnings(TPV.monthlyPLData(year));
  });
}

// Helper for quick date buttons
function setDashDates(period) {
  const now = new Date();
  let from, to = now.toISOString().slice(0,10);
  const _ds = d => d.toISOString().slice(0,10);
  const _ago = n => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

  if (period === 'yesterday') {
    from = _ds(_ago(1)); to = _ds(_ago(1));
  }
  else if (period === 'weekend') {
    const dow = now.getDay();
    let fOff, sOff;
    if (dow === 1) { fOff = 4; sOff = 1; }
    else if (dow === 0) { fOff = 2; sOff = 1; }
    else if (dow === 6) { from = _ds(_ago(1)); to = _ds(_ago(1));
      document.getElementById('dash-from').value = from;
      document.getElementById('dash-to').value = to;
      TPV.invalidateAll(); initTPVDashboard(from, to); return;
    } else { fOff = dow + 2; sOff = dow; }
    from = _ds(_ago(fOff)); to = _ds(_ago(sOff));
  }
  else if (period === 'this_month') { from = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01'; }
  else if (period === 'last_month') { const d = new Date(now.getFullYear(), now.getMonth()-1, 1); from = d.toISOString().slice(0,10); to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0,10); }
  else if (period === 'last_3') { const d = new Date(now.getFullYear(), now.getMonth()-2, 1); from = d.toISOString().slice(0,10); }
  else if (period === 'all') { from = null; to = null; }
  const dfEl = document.getElementById('dash-from'); if(dfEl) dfEl.value = from || '';
  const dtEl = document.getElementById('dash-to'); if(dtEl) dtEl.value = to || '';
  TPV.invalidateAll();
  initTPVDashboard(from, to);
}
function setPagosDates(period) {
  const now = new Date();
  let from, to = now.toISOString().slice(0,10);
  const _ds = d => d.toISOString().slice(0,10); // date to string helper
  const _ago = n => { const d = new Date(now); d.setDate(d.getDate() - n); return d; }; // N days ago

  if (period === 'today') {
    // "Hoy" = cobros de hoy corresponden a transacciones de ayer
    const ayer = _ago(1);
    from = _ds(ayer);
    to = _ds(ayer);
  }
  else if (period === 'weekend') {
    // "Fin de Semana" = viernes a domingo
    // Si hoy es lunes (1): por el corte de las 11 PM, incluir desde jueves
    // dow: 0=dom, 1=lun, 2=mar, 3=mie, 4=jue, 5=vie, 6=sab
    const dow = now.getDay();
    let fridayOffset, sundayOffset;
    if (dow === 1) {
      // Lunes: jueves(-4) a domingo(-1) por el corte 11 PM
      fridayOffset = 4; // jueves
      sundayOffset = 1; // domingo
    } else if (dow === 0) {
      // Domingo: viernes(-2) a sábado(-1) (hoy aún es domingo)
      fridayOffset = 2;
      sundayOffset = 1;
    } else if (dow === 6) {
      // Sábado: viernes(-1) es ayer
      fridayOffset = 1;
      sundayOffset = 0; // hoy no hay domingo aún, solo hasta viernes
      // Pero mostramos viernes
      from = _ds(_ago(1));
      to = _ds(_ago(1));
      const dfEl = document.getElementById('pagos-from'); if(dfEl) dfEl.value = from || '';
      const dtEl = document.getElementById('pagos-to'); if(dtEl) dtEl.value = to || '';
      TPV.invalidateAll();
      rTPVPagos();
      return;
    } else {
      // Martes(2) a viernes(5): buscar el fin de semana pasado
      // Viernes pasado: retroceder (dow - 5 + 7) % 7 o simplemente calcular
      // dow=2(mar): vie=-4, dom=-2  |  dow=3(mie): vie=-5, dom=-3
      // dow=4(jue): vie=-6, dom=-4  |  dow=5(vie): vie=-7, dom=-5
      fridayOffset = dow + 2; // viernes pasado
      sundayOffset = dow;      // domingo pasado
    }
    from = _ds(_ago(fridayOffset));
    to = _ds(_ago(sundayOffset));
  }
  else if (period === 'this_month') { from = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01'; }
  else if (period === 'last_month') { const d = new Date(now.getFullYear(), now.getMonth()-1, 1); from = d.toISOString().slice(0,10); to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0,10); }
  else if (period === 'last_3') { const d = new Date(now.getFullYear(), now.getMonth()-2, 1); from = d.toISOString().slice(0,10); }
  else if (period === 'all') { from = null; to = null; }
  const dfEl = document.getElementById('pagos-from'); if(dfEl) dfEl.value = from || '';
  const dtEl = document.getElementById('pagos-to'); if(dtEl) dtEl.value = to || '';
  TPV.invalidateAll();
  rTPVPagos();
}


// ═══════════════════════════════════════
// SALEM MONTHLY EARNINGS — Dashboard Section + Modal
// ═══════════════════════════════════════

const MES_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function _renderSalemEarnings(data) {
  const kSalem = document.getElementById('se-kpi-salem');
  const kPromo = document.getElementById('se-kpi-promo');
  const kInternas = document.getElementById('se-kpi-internas');
  const kNeto = document.getElementById('se-kpi-neto');
  const sub = document.getElementById('salem-earn-subtitle');
  if (!kSalem) return;

  if (!data || !data.monthly) {
    kSalem.textContent = '—';
    kPromo.textContent = '—';
    kInternas.textContent = '—';
    kNeto.textContent = '—';
    if (sub) sub.textContent = 'Datos no disponibles — carga datos TPV primero';
    return;
  }

  const totSalem = data.monthly.reduce((s, m) => s + (m.com_salem || 0), 0);
  const totPromo = data.monthly.reduce((s, m) => s + (m.com_comisionista || 0), 0);
  const totInternas = data.monthly.reduce((s, m) => s + (m.com_agentes || 0), 0);
  const neto = totSalem - totPromo - totInternas;

  kSalem.textContent = fmtTPV(totSalem);
  kPromo.textContent = fmtTPV(totPromo);
  kInternas.textContent = fmtTPV(totInternas);
  kNeto.textContent = fmtTPV(neto);
  if (sub) {
    const activeMo = data.monthly.filter(m => m.com_salem > 0).length;
    sub.textContent = `${data.year} · ${activeMo} meses con actividad · Auto-sync P&L`;
  }

  // Mini bar chart — monthly com_salem
  const canvas = document.getElementById('c-tpv-salem-monthly');
  if (!canvas) return;
  const isDark = document.body.classList.contains('dark');
  const gridC = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const textC = isDark ? '#9da0c5' : '#8b8fb5';

  if (TPV_CHARTS['csalearnm']) TPV_CHARTS['csalearnm'].destroy();
  TPV_CHARTS['csalearnm'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: MES_NAMES,
      datasets: [
        { label: 'Com. Salem', data: data.monthly.map(m => m.com_salem || 0), backgroundColor: '#0073ea33', borderColor: '#0073ea', borderWidth: 1.5, borderRadius: 3 },
        { label: 'Promotoría', data: data.monthly.map(m => -(m.com_comisionista || 0)), backgroundColor: '#ff704333', borderColor: '#ff7043', borderWidth: 1.5, borderRadius: 3 },
        { label: 'Internas', data: data.monthly.map(m => -(m.com_agentes || 0)), backgroundColor: '#9b51e033', borderColor: '#9b51e0', borderWidth: 1.5, borderRadius: 3 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, color: textC, boxWidth: 10, padding: 8 } } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: textC, font: { size: 8 } } },
        y: { stacked: true, grid: { color: gridC }, ticks: { color: textC, font: { size: 8 }, callback: v => v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'K' : '$' + v } }
      }
    }
  });
}

function openSalemEarnings() {
  const year = new Date().getFullYear().toString();
  const data = TPV.monthlyPLData(year);
  if (!data || !data.monthly) {
    if (typeof toast === 'function') toast('⚠️ No hay datos mensuales — carga el Dashboard TPV primero');
    return;
  }

  const ov = document.getElementById('salem-earnings-overlay');
  if (!ov) return;

  // Update subtitle
  const sub = document.getElementById('salem-earn-modal-subtitle');
  if (sub) sub.textContent = `Año ${data.year} · ${data.byClient ? data.byClient.length : 0} clientes · Actualizado ${new Date(data.updated).toLocaleString('es-MX')}`;

  // Monthly summary table
  const tbody = document.getElementById('salem-earn-monthly-tbody');
  const tfoot = document.getElementById('salem-earn-monthly-tfoot');
  if (tbody) {
    tbody.innerHTML = data.monthly.map((m, i) => {
      const neto = (m.com_salem || 0) - (m.com_comisionista || 0) - (m.com_agentes || 0);
      const hasData = m.com_salem > 0;
      return `<tr style="${!hasData ? 'opacity:.4' : ''}">
        <td class="bld">${MES_NAMES[i]}</td>
        <td class="mo" style="color:#0073ea">${fmtTPVFull(m.com_salem)}</td>
        <td class="mo" style="color:#ff7043">${fmtTPVFull(m.com_comisionista)}</td>
        <td class="mo" style="color:#9b51e0">${fmtTPVFull(m.com_agentes)}</td>
        <td class="mo bld ${neto >= 0 ? 'pos' : 'neg'}">${fmtTPVFull(neto)}</td>
        <td class="mo">${fmtTPVFull(m.total_cobrado)}</td>
      </tr>`;
    }).join('');
  }
  if (tfoot) {
    const tSalem = data.monthly.reduce((s, m) => s + (m.com_salem || 0), 0);
    const tPromo = data.monthly.reduce((s, m) => s + (m.com_comisionista || 0), 0);
    const tInt = data.monthly.reduce((s, m) => s + (m.com_agentes || 0), 0);
    const tCob = data.monthly.reduce((s, m) => s + (m.total_cobrado || 0), 0);
    const tNeto = tSalem - tPromo - tInt;
    tfoot.innerHTML = `<tr style="font-weight:700;border-top:2px solid var(--border)">
      <td>TOTAL</td>
      <td class="mo" style="color:#0073ea">${fmtTPVFull(tSalem)}</td>
      <td class="mo" style="color:#ff7043">${fmtTPVFull(tPromo)}</td>
      <td class="mo" style="color:#9b51e0">${fmtTPVFull(tInt)}</td>
      <td class="mo bld ${tNeto >= 0 ? 'pos' : 'neg'}">${fmtTPVFull(tNeto)}</td>
      <td class="mo">${fmtTPVFull(tCob)}</td>
    </tr>`;
  }

  // Per-client detail table
  const cTbody = document.getElementById('salem-earn-client-tbody');
  if (cTbody && data.byClient) {
    cTbody.innerHTML = data.byClient.map((c, i) => {
      const neto = c.total_salem - c.total_comisionista - c.total_agentes;
      const pctPromo = c.total_salem > 0 ? ((c.total_comisionista + c.total_agentes) / c.total_salem * 100).toFixed(1) : '0.0';
      return `<tr data-name="${c.cliente.toLowerCase()}">
        <td style="color:var(--muted);font-size:.72rem">${i + 1}</td>
        <td class="bld">${escapeHtml(c.cliente)}</td>
        <td>${c.agente ? '<span style="font-size:.65rem;background:var(--purple-bg);color:var(--purple);padding:2px 5px;border-radius:4px">' + escapeHtml(c.siglas || c.agente) + '</span>' : '<span style="color:var(--muted);font-size:.65rem">—</span>'}</td>
        <td class="mo" style="color:#0073ea">${fmtTPVFull(c.total_salem)}</td>
        <td class="mo" style="color:#ff7043">${fmtTPVFull(c.total_comisionista)}</td>
        <td class="mo" style="color:#9b51e0">${fmtTPVFull(c.total_agentes)}</td>
        <td class="mo">${pctPromo}%</td>
        <td class="mo bld ${neto >= 0 ? 'pos' : 'neg'}">${fmtTPVFull(neto)}</td>
      </tr>`;
    }).join('');
  }

  ov.style.display = 'flex';
}

function closeSalemEarnings() {
  const ov = document.getElementById('salem-earnings-overlay');
  if (ov) ov.style.display = 'none';
}

function filterSalemClients(q) {
  const rows = document.querySelectorAll('#salem-earn-client-tbody tr');
  const lq = q.toLowerCase();
  rows.forEach(r => { r.style.display = r.dataset.name && r.dataset.name.includes(lq) ? '' : 'none'; });
}


// ── AGENT PAYMENT TRACKING (localStorage) ──
const AGENTE_PAGOS_KEY = 'gf_tpv_agente_pagos';
let _agentesCache = [];

function agentePagosLoad() { try { return DB.get(AGENTE_PAGOS_KEY) || {}; } catch(e) { return {}; } }
function agentePagosSave(data) { DB.set(AGENTE_PAGOS_KEY, data); }
function agenteTotalPagado(agenteId) {
  const data = agentePagosLoad();
  return (data[agenteId] || []).reduce((s, p) => s + p.monto, 0);
}

async function rTPVAgentes(){
  const tbody=document.getElementById('agentes-tbody');if(!tbody)return;
  const agents = await TPV.agentSummary() || [];
  const agPagosData = agentePagosLoad();

  // Enrich with payment data
  const enriched = agents.map(ag => {
    const comAgente = parseFloat(ag.com_agente||0);
    const pagado = agenteTotalPagado(ag.agente_id);
    const pendiente = Math.max(0, comAgente - pagado);
    return { ...ag, _pagado: pagado, _pendiente: pendiente, _nPagos: (agPagosData[ag.agente_id]||[]).length };
  });
  _agentesCache = enriched;

  // Populate agent filter dropdown + search cache
  _agenteOptions = enriched.map(a => ({ value: String(a.agente_id), label: `${a.agente} (${a.siglas})` }));
  const agenteFilter = document.getElementById('agente-filter');
  if (agenteFilter) {
    const prev = agenteFilter.value;
    agenteFilter.innerHTML = '<option value="">Todos los agentes</option>' +
      _agenteOptions.map(o => `<option value="${o.value}" ${o.value === prev ? 'selected' : ''}>${o.label}</option>`).join('');
  }
  const agenteSearchEl = document.getElementById('agente-search');
  if (agenteSearchEl) agenteSearchEl.value = '';

  const totV=enriched.reduce((a,ag)=>a+parseFloat(ag.vendido||0),0);
  const totC=enriched.reduce((a,ag)=>a+parseFloat(ag.com_agente||0),0);
  const totPagado=enriched.reduce((a,ag)=>a+ag._pagado,0);
  const totPend=enriched.reduce((a,ag)=>a+ag._pendiente,0);

  const sub=document.getElementById('agentes-subtitle');
  if(sub) sub.textContent=`${enriched.length} agentes · Com. sobre com. Salem · Pagado ${fmtTPV(totPagado)} de ${fmtTPV(totC)}`;

  // Restore table header and titles (in case we're coming back from client breakdown)
  const theadRow = document.getElementById('agentes-thead');
  if (theadRow) theadRow.innerHTML = '<th>Agente</th><th>Sig.</th><th class="r">% Com.</th><th class="r">Total Vendido</th><th class="r">Com. Salem</th><th class="r">Com. Agente</th><th class="r">Clientes</th><th class="r">Activos</th><th class="r" style="color:var(--green)">Pagado</th><th class="r" style="color:var(--red)">Pendiente</th><th>Acción</th>';
  const tTitle = document.getElementById('agentes-table-title');
  if (tTitle) tTitle.textContent = 'Detalle por Agente';
  const cTitle = document.getElementById('agentes-chart-title');
  if (cTitle) cTitle.textContent = 'Vendido por Agente';
  const cSub = document.getElementById('agentes-chart-sub');
  if (cSub) cSub.textContent = 'Total histórico';

  const kEl=document.getElementById('agentes-kpis');
  if(kEl)kEl.innerHTML=`
    <div class="kpi-card" style="--ac:#0073ea"><div class="kpi-top"><div class="kpi-lbl">Agentes Activos</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">🤝</div></div><div class="kpi-val" style="color:#0073ea">${enriched.length}</div><div class="kpi-d dnu">Con clientes asignados</div><div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">Total Vendido</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💰</div></div><div class="kpi-val" style="color:var(--green)">${fmtTPV(totV)}</div><div class="kpi-d dnu">Por todos los agentes</div><div class="kbar"><div class="kfill" style="background:var(--green);width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--orange)"><div class="kpi-top"><div class="kpi-lbl">Com. Agentes</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">📈</div></div><div class="kpi-val" style="color:var(--orange)">${fmtTPV(totC)}</div><div class="kpi-d dup">Pagado: ${fmtTPV(totPagado)} (${totC>0?(totPagado/totC*100).toFixed(0):0}%)</div><div class="kbar"><div class="kfill" style="background:var(--orange);width:${totC>0?Math.min(totPagado/totC*100,100).toFixed(0):0}%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--red)"><div class="kpi-top"><div class="kpi-lbl">Pendiente Pago</div><div class="kpi-ico" style="background:var(--red-bg);color:var(--red)">⏳</div></div><div class="kpi-val" style="color:var(--red)">${fmtTPV(totPend)}</div><div class="kpi-d dnu">${enriched.filter(a=>a._pendiente>0).length} agentes con saldo</div><div class="kbar"><div class="kfill" style="background:var(--red);width:${totC>0?Math.min(totPend/totC*100,100).toFixed(0):0}%"></div></div></div>`;
  tbody.innerHTML=enriched.map(ag=>{
    const badge=ag._pendiente<=0?'<span class="tpv-badge-ok">Al día</span>':`<span class="tpv-badge-warn">${fmtTPVFull(ag._pendiente)}</span>`;
    const histBtn = ag._nPagos > 0 ? `<span style="font-size:.6rem;background:var(--blue-bg);color:var(--blue);border-radius:10px;padding:1px 6px;font-weight:700">${ag._nPagos}</span>` : '';
    return`<tr>
      <td class="bld">${escapeHtml(ag.agente)}</td>
      <td><span style="font-size:.67rem;background:var(--blue-bg);color:#0060b8;border:1px solid var(--blue-lt);padding:1px 7px;border-radius:10px;font-weight:700">${escapeHtml(ag.siglas)}</span></td>
      <td class="mo">${(parseFloat(ag.pct||0)*100).toFixed(0)}%</td>
      <td class="mo bld">${fmtTPVFull(ag.vendido)}</td>
      <td class="mo">${fmtTPVFull(ag.com_salem)}</td>
      <td class="mo pos">${fmtTPVFull(ag.com_agente)}</td>
      <td class="mo" style="text-align:center">${ag.num_clientes||0}</td>
      <td class="mo" style="text-align:center">${ag.num_activos||0}</td>
      <td class="mo pos">${ag._pagado>0?fmtTPVFull(ag._pagado):'<span style="color:var(--muted)">—</span>'}</td>
      <td>${badge}</td>
      <td style="text-align:center;white-space:nowrap">
        <button onclick="openHistorialAgente(${ag.agente_id})" title="Historial" style="background:none;border:none;cursor:pointer;font-size:.8rem;color:var(--muted);padding:2px 4px">🕐${histBtn}</button>
        ${!isViewer() ? `<button onclick="openEditAgente(${ag.agente_id})" title="Editar" style="background:none;border:none;cursor:pointer;font-size:.8rem;color:var(--blue);padding:2px 4px">✏️</button>
        <button onclick="openPagoAgenteModal(${ag.agente_id})" style="background:var(--blue);color:#fff;border:none;border-radius:6px;padding:3px 8px;font-size:.65rem;font-weight:700;cursor:pointer;font-family:'Figtree',sans-serif">+ Pago</button>` : ''}
      </td></tr>`;
  }).join('');
  // Chart
  setTimeout(()=>{
    const isDark=document.body.classList.contains('dark');
    const textC=isDark?'#9da0c5':'#8b8fb5';
    const filtered=enriched.filter(a=>parseFloat(a.vendido)>0);
    if(TPV_CHARTS['agentes'])TPV_CHARTS['agentes'].destroy();
    const canvas=document.getElementById('c-tpv-agentes');if(!canvas)return;
    TPV_CHARTS['agentes']=new Chart(canvas,{type:'bar',
      data:{labels:filtered.map(a=>a.siglas),datasets:[
        {label:'Com. Agente',data:filtered.map(a=>parseFloat(a.com_agente)),backgroundColor:'#ff704322',borderColor:'#ff7043',borderWidth:1.5,borderRadius:4},
        {label:'Pagado',data:filtered.map(a=>a._pagado),backgroundColor:'#00b87522',borderColor:'#00b875',borderWidth:1.5,borderRadius:4}
      ]},
      options:{plugins:{legend:{position:'bottom',labels:{font:{size:9},color:textC,boxWidth:10}}},scales:{
        x:{grid:{display:false},ticks:{color:textC,font:{size:9}}},
        y:{grid:{color:isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)'},ticks:{color:textC,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1000?'$'+(v/1000).toFixed(0)+'K':'$'+v}}
      }}
    });
  },50);
}

// Agent payment modal functions
function openPagoAgenteModal(agenteId) {
  const ov = document.getElementById('pago-agente-overlay');
  ov.style.display = 'flex';
  document.getElementById('pago-agente-fecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('pago-agente-monto').value = '';
  document.getElementById('pago-agente-ref').value = '';
  const sel = document.getElementById('pago-agente-sel');
  // Populate options + search cache
  _pagoAgenteAllOptions = _agentesCache.map(a => ({ value: String(a.agente_id), label: `${a.agente} (${a.siglas})` }));
  sel.innerHTML = '<option value="">— Seleccionar agente —</option>' +
    _agentesCache.map(a => `<option value="${a.agente_id}" ${a.agente_id===agenteId?'selected':''}>${escapeHtml(a.agente)} (${escapeHtml(a.siglas)})</option>`).join('');
  const pagoAgSearchEl = document.getElementById('pago-agente-search');
  if (pagoAgSearchEl) pagoAgSearchEl.value = '';
  if (agenteId) { document.getElementById('pago-agente-title').textContent = 'Pago a ' + (_agentesCache.find(a=>a.agente_id===agenteId)?.agente||'Agente'); }
  else { document.getElementById('pago-agente-title').textContent = 'Registrar Pago a Agente'; }
  pagoAgenteUpdateSaldo();
}
function closePagoAgenteModal() { document.getElementById('pago-agente-overlay').style.display = 'none'; }
function pagoAgenteUpdateSaldo() {
  const selId = parseInt(document.getElementById('pago-agente-sel').value);
  const info = document.getElementById('pago-agente-saldo-info');
  if (!selId) { info.style.display = 'none'; return; }
  const ag = _agentesCache.find(a => a.agente_id === selId);
  if (!ag) return;
  document.getElementById('pago-agente-saldo-val').textContent = fmtTPVFull(ag._pendiente);
  info.style.display = '';
}
function submitPagoAgente() {
  const selId = parseInt(document.getElementById('pago-agente-sel').value);
  if (!selId) { toast('⚠️ Selecciona un agente'); return; }
  const fecha = document.getElementById('pago-agente-fecha').value;
  const monto = parseFloat(document.getElementById('pago-agente-monto').value);
  const ref = document.getElementById('pago-agente-ref').value.trim();
  if (!fecha) { toast('⚠️ Ingresa la fecha'); return; }
  if (!monto || monto <= 0) { toast('⚠️ Ingresa un monto válido'); return; }
  const data = agentePagosLoad();
  if (!data[selId]) data[selId] = [];
  data[selId].push({ id: Date.now(), fecha, monto, ref, registrado: new Date().toLocaleString('es-MX') });
  agentePagosSave(data);
  const ag = _agentesCache.find(a => a.agente_id === selId);
  toast(`✅ Pago de ${fmtTPVFull(monto)} a ${ag?.agente||'agente'}`);
  closePagoAgenteModal();
  rTPVAgentes();
  if(_currentView==='tpv_promotores') rTPVPromotoresDetail();
}
function openHistorialAgente(agenteId) {
  const ag = _agentesCache.find(a => a.agente_id === agenteId);
  if (!ag) return;
  const data = agentePagosLoad();
  const pagos = (data[agenteId] || []).sort((a, b) => b.fecha.localeCompare(a.fecha));
  document.getElementById('hist-agente-title').textContent = '🕐 Historial — ' + ag.agente;
  document.getElementById('hist-agente-subtitle').textContent = `${pagos.length} pago${pagos.length!==1?'s':''} registrado${pagos.length!==1?'s':''}`;
  document.getElementById('hist-agente-kpis').innerHTML = `
    <div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Com. Agente</div><div class="m-kpi-val" style="color:var(--orange)">${fmtTPVFull(ag.com_agente)}</div></div>
    <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Pagado</div><div class="m-kpi-val" style="color:var(--green)">${fmtTPVFull(ag._pagado)}</div></div>
    <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Pendiente</div><div class="m-kpi-val" style="color:var(--red)">${fmtTPVFull(ag._pendiente)}</div></div>`;
  if (pagos.length === 0) {
    document.getElementById('hist-agente-body').innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:.8rem">Sin pagos registrados</div>';
  } else {
    document.getElementById('hist-agente-body').innerHTML = `<table class="bt"><thead><tr><th>Fecha</th><th class="r">Monto</th><th>Referencia</th><th>Registrado</th><th></th></tr></thead><tbody>
      ${pagos.map(p => `<tr><td class="bld">${p.fecha}</td><td class="mo pos">${fmtTPVFull(p.monto)}</td><td style="color:var(--muted);font-size:.72rem">${p.ref||'—'}</td><td style="color:var(--muted);font-size:.66rem">${p.registrado}</td><td>${!isViewer() ? `<button onclick="deletePagoAgente(${agenteId},${p.id})" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:.75rem">🗑</button>` : ''}</td></tr>`).join('')}
    </tbody></table>`;
  }
  document.getElementById('historial-agente-overlay').style.display = 'flex';
}
function closeHistorialAgente() { document.getElementById('historial-agente-overlay').style.display = 'none'; }

// ── MODAL: TOP 10 CLIENTES POR COMISIÓN ──
async function openTopComisiones() {
  const ov = document.getElementById('top-comisiones-overlay');
  if (!ov) return;
  ov.style.display = 'flex';

  const tbody = document.getElementById('top-com-tbody');
  const kpisDiv = document.getElementById('top-com-kpis');
  const subDiv = document.getElementById('top-com-subtitle');
  if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--muted)">Cargando...</td></tr>';

  try {
    const data = await TPV.clientCommissions();
    if (!data || !data.length) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--muted)">Sin datos</td></tr>';
      return;
    }

    const top10 = data.slice(0, 10);
    const totalCom = data.reduce((s, r) => s + parseFloat(r.monto_neto || 0), 0);
    const top10Com = top10.reduce((s, r) => s + parseFloat(r.monto_neto || 0), 0);
    const top10Pct = totalCom > 0 ? (top10Com / totalCom * 100).toFixed(1) : '0';

    // KPI chips
    if (kpisDiv) {
      kpisDiv.innerHTML = `
        <div style="background:var(--green-bg);color:var(--green);padding:6px 14px;border-radius:8px;font-size:.72rem;font-weight:600">
          Total: ${fmtTPV(totalCom)}
        </div>
        <div style="background:var(--blue-bg);color:#0073ea;padding:6px 14px;border-radius:8px;font-size:.72rem;font-weight:600">
          Top 10: ${fmtTPV(top10Com)} (${top10Pct}%)
        </div>
        <div style="background:var(--purple-bg);color:var(--purple);padding:6px 14px;border-radius:8px;font-size:.72rem;font-weight:600">
          ${data.length} clientes activos
        </div>`;
    }
    if (subDiv) subDiv.textContent = 'Acumulado histórico · ' + data.length + ' clientes con actividad';

    // Table
    if (tbody) {
      tbody.innerHTML = top10.map((r, i) => {
        const neto = parseFloat(r.monto_neto || 0);
        const pct = totalCom > 0 ? (neto / totalCom * 100).toFixed(1) : '0.0';
        const barW = top10[0] && parseFloat(top10[0].monto_neto) > 0
          ? (neto / parseFloat(top10[0].monto_neto) * 100).toFixed(0) : 0;
        return `<tr>
          <td style="font-weight:700;color:var(--green)">${i + 1}</td>
          <td><b>${r.cliente || '-'}</b>${r._rate_corrected ? ' <span title="Ajuste por cambio de tasa" style="font-size:.5rem;background:var(--purple-bg);color:var(--purple);border-radius:4px;padding:0 4px;font-weight:700;vertical-align:middle">📊</span>' : ''}</td>
          <td style="text-align:right">${fmtTPV(r.total_cobrado)}</td>
          <td style="text-align:right">${fmtTPV(r.com_efevoo)}</td>
          <td style="text-align:right">${fmtTPV(r.com_salem)}</td>
          <td style="text-align:right">${fmtTPV(r.com_convenia)}</td>
          <td style="text-align:right">${fmtTPV(r.com_comisionista)}</td>
          <td style="text-align:right"><b style="color:var(--green)">${fmtTPV(neto)}</b>
            <div style="height:3px;background:var(--border);border-radius:2px;margin-top:3px"><div style="height:100%;background:var(--green);border-radius:2px;width:${barW}%"></div></div>
          </td>
          <td style="text-align:right;font-weight:600">${pct}%</td>
        </tr>`;
      }).join('');
    }
  } catch (e) {
    console.error('[TPV] openTopComisiones error:', e);
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:#e53935">Error al cargar datos</td></tr>';
  }
}
function closeTopComisiones() { document.getElementById('top-comisiones-overlay').style.display = 'none'; }
function deletePagoAgente(agenteId, pagoId) {
  if (!confirm('¿Eliminar este pago?')) return;
  const data = agentePagosLoad();
  if (data[agenteId]) { data[agenteId] = data[agenteId].filter(p => p.id !== pagoId); if (data[agenteId].length === 0) delete data[agenteId]; }
  agentePagosSave(data);
  toast('🗑 Pago eliminado');
  closeHistorialAgente();
  rTPVAgentes();
  if(_currentView==='tpv_promotores') rTPVPromotoresDetail();
}
function exportAgentesCSV() {
  if (!_agentesCache.length) { toast('⚠️ No hay datos'); return; }
  let csv = 'Agente,Siglas,%Com,Vendido,Com Salem,Com Agente,Pagado,Pendiente\n';
  _agentesCache.forEach(a => { csv += `"${a.agente}","${a.siglas}",${(parseFloat(a.pct||0)*100).toFixed(0)}%,${parseFloat(a.vendido).toFixed(2)},${parseFloat(a.com_salem).toFixed(2)},${parseFloat(a.com_agente).toFixed(2)},${a._pagado.toFixed(2)},${a._pendiente.toFixed(2)}\n`; });
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'agentes_comisiones.csv'; a.click();
}

// ── EDITAR / NUEVO AGENTE ──
function openEditAgente(agenteId) {
  const ov = document.getElementById('edit-agente-overlay');
  const title = document.getElementById('edit-agente-title');
  if (agenteId) {
    // Editar existente
    const ag = _agentesCache.find(a => a.agente_id === agenteId);
    if (!ag) { toast('⚠️ Agente no encontrado'); return; }
    document.getElementById('edit-agente-id').value = agenteId;
    document.getElementById('edit-agente-nombre').value = ag.agente || '';
    document.getElementById('edit-agente-siglas').value = ag.siglas || '';
    document.getElementById('edit-agente-pct').value = (parseFloat(ag.pct || 0) * 100).toFixed(0);
    document.getElementById('edit-agente-activo').value = ag.activo !== false ? 'true' : 'false';
    title.textContent = 'Editar Agente';
  } else {
    // Nuevo agente
    document.getElementById('edit-agente-id').value = '';
    document.getElementById('edit-agente-nombre').value = '';
    document.getElementById('edit-agente-siglas').value = '';
    document.getElementById('edit-agente-pct').value = '10';
    document.getElementById('edit-agente-activo').value = 'true';
    title.textContent = 'Nuevo Agente';
  }
  ov.style.display = 'flex';
}

function closeEditAgente() {
  document.getElementById('edit-agente-overlay').style.display = 'none';
}

async function submitEditAgente() {
  const id = document.getElementById('edit-agente-id').value;
  const nombre = document.getElementById('edit-agente-nombre').value.trim();
  const siglas = document.getElementById('edit-agente-siglas').value.trim().toUpperCase();
  const pctVal = parseFloat(document.getElementById('edit-agente-pct').value);
  const activo = document.getElementById('edit-agente-activo').value === 'true';

  if (!nombre) { toast('⚠️ El nombre es requerido'); return; }
  if (!siglas) { toast('⚠️ Las siglas son requeridas'); return; }
  if (isNaN(pctVal) || pctVal < 0 || pctVal > 100) { toast('⚠️ % Comisión debe ser entre 0 y 100'); return; }

  const agente = { nombre, siglas, pct_comision: pctVal / 100, activo };
  if (id) agente.id = parseInt(id);

  try {
    await TPV.saveAgente(agente);
    toast(`✅ Agente ${nombre} guardado`);
    closeEditAgente();
    await rTPVAgentes();
  } catch (e) {
    toast('❌ Error al guardar: ' + (e.message || e));
  }
}

// ═══════════════════════════════════════
// PROMOTORES VIEW
// ═══════════════════════════════════════
const PROM_PAGOS_KEY = 'gf_tpv_promotor_pagos';
let _promSelectedName = null;
let _promAllOptions = [];
let _promClientRows = [];

function promPagosLoad(){ try{return DB.get(PROM_PAGOS_KEY)||{};}catch(e){return {};} }
function promPagosSave(data){ DB.set(PROM_PAGOS_KEY,data); }
function promTotalPagado(name){ return (promPagosLoad()[name]||[]).reduce((s,p)=>s+p.monto,0); }

function setPromDates(period){
  const now=new Date();
  let from,to=now.toISOString().slice(0,10);
  if(period==='this_month'){from=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01';}
  else if(period==='last_month'){const d=new Date(now.getFullYear(),now.getMonth()-1,1);from=d.toISOString().slice(0,10);to=new Date(now.getFullYear(),now.getMonth(),0).toISOString().slice(0,10);}
  else if(period==='last_3'){const d=new Date(now.getFullYear(),now.getMonth()-2,1);from=d.toISOString().slice(0,10);}
  else if(period==='all'){from=null;to=null;}
  const dfEl=document.getElementById('prom-from');if(dfEl)dfEl.value=from||'';
  const dtEl=document.getElementById('prom-to');if(dtEl)dtEl.value=to||'';
  TPV.invalidateAll();
  rTPVPromotoresDetail();
}

function filterPromotorOptions(q){
  _filterSelectOptions('prom-sel',_promAllOptions,q,'— Seleccionar promotor —');
}

async function rTPVPromotores(){
  // Populate dropdown from unique promotor values in tpv_clients
  const allClients=await TPV.getClients()||[];
  const promotores=[...new Set(allClients.map(c=>c.promotor||'Sin Promotor'))].filter(p=>p&&p!=='Sin Promotor').sort();
  _promAllOptions=promotores.map(p=>({value:p,label:p}));
  const sel=document.getElementById('prom-sel');
  if(sel){
    const prev=sel.value;
    sel.innerHTML='<option value="">— Seleccionar promotor —</option>'+
      promotores.map(p=>`<option value="${p}" ${p===prev?'selected':''}>${p}</option>`).join('');
  }
  const fromEl=document.getElementById('prom-from'),toEl=document.getElementById('prom-to');
  if(fromEl&&!fromEl.value){const now=new Date();fromEl.value=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01';}
  if(toEl&&!toEl.value){toEl.value=new Date().toISOString().slice(0,10);}
  const kEl=document.getElementById('prom-kpis');
  if(kEl)kEl.innerHTML='<div class="kpi-card" style="--ac:var(--muted)"><div class="kpi-val" style="color:var(--muted);font-size:.8rem">Selecciona un promotor arriba</div></div>';
  const cb=document.getElementById('prom-clients-tbody');if(cb)cb.innerHTML='';
  const ct=document.getElementById('prom-com-tbody');if(ct)ct.innerHTML='';
  const pt=document.getElementById('prom-pagos-tbody');if(pt)pt.innerHTML='';
  const tt=document.getElementById('prom-totals');if(tt)tt.style.display='none';
  const ck=document.getElementById('prom-com-kpis');if(ck)ck.innerHTML='';
  if(sel&&sel.value) rTPVPromotoresDetail();
}

async function rTPVPromotoresDetail(){
  const selName=document.getElementById('prom-sel')?.value;
  if(!selName){
    _promSelectedName=null;
    const kEl=document.getElementById('prom-kpis');
    if(kEl)kEl.innerHTML='<div class="kpi-card" style="--ac:var(--muted)"><div class="kpi-val" style="color:var(--muted);font-size:.8rem">Selecciona un promotor arriba</div></div>';
    return;
  }
  _promSelectedName=selName;
  const fromDate=document.getElementById('prom-from')?.value||null;
  const toDate=document.getElementById('prom-to')?.value||null;
  const periodText=fromDate&&toDate?`${fromDate} → ${toDate}`:'Histórico completo';

  const [allClients,comData]=await Promise.all([
    TPV.getClients(),TPV.clientCommissions(fromDate,toDate)
  ]);

  // Filter clients by promotor name
  const promClientIds=(allClients||[]).filter(c=>(c.promotor||'Sin Promotor')===selName).map(c=>c.id);
  const pData=pagosLoad();

  const rows=(comData||[]).filter(c=>promClientIds.includes(c.client_id)).map(c=>{
    const cobrado=parseFloat(c.total_cobrado)||0;
    const comTotal=parseFloat(c.monto_neto)||0;
    const aPagar=cobrado-comTotal;
    const pagado=pagosTotalCliente(c.client_id,pData);
    const saldo=Math.max(0,aPagar-pagado);
    return {id:c.client_id,cliente:c.cliente,total_cobrado:cobrado,total_comisiones:comTotal,
      com_comisionista:parseFloat(c.com_comisionista)||0,a_pagar:aPagar,_pagado:pagado,_saldo:saldo,
      _nPagos:(pData[c.client_id]||[]).filter(p=>!p.anulado).length};
  }).sort((a,b)=>b.total_cobrado-a.total_cobrado);

  _promClientRows=rows;

  // Aggregates
  const totCobrado=rows.reduce((s,r)=>s+r.total_cobrado,0);
  const totComisiones=rows.reduce((s,r)=>s+r.total_comisiones,0);
  const totAPagar=rows.reduce((s,r)=>s+r.a_pagar,0);
  const totPagadoClientes=rows.reduce((s,r)=>s+r._pagado,0);
  const totSaldoClientes=rows.reduce((s,r)=>s+r._saldo,0);
  // Promoter commission = sum of com_comisionista across their clients
  const comPromotor=rows.reduce((s,r)=>s+r.com_comisionista,0);
  const pagadoPromotor=promTotalPagado(selName);
  const pendientePromotor=Math.max(0,comPromotor-pagadoPromotor);
  const totalOwed=totAPagar+comPromotor;
  const totalPaid=totPagadoClientes+pagadoPromotor;
  const totalPending=totSaldoClientes+pendientePromotor;

  // Subtitle
  const sub=document.getElementById('prom-subtitle');
  if(sub)sub.innerHTML=`<b>${selName}</b> — ${rows.length} clientes — ${periodText}`;

  // KPIs
  const kEl=document.getElementById('prom-kpis');
  if(kEl)kEl.innerHTML=`
    <div class="kpi-card" style="--ac:#0073ea"><div class="kpi-top"><div class="kpi-lbl">Total Cobrado</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">💰</div></div><div class="kpi-val" style="color:#0073ea">${fmtTPV(totCobrado)}</div><div class="kpi-d dnu">${rows.length} clientes del promotor</div><div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--orange)"><div class="kpi-top"><div class="kpi-lbl">Total Comisiones</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">📊</div></div><div class="kpi-val" style="color:var(--orange)">${fmtTPV(totComisiones)}</div><div class="kpi-d dnu">${totCobrado>0?(totComisiones/totCobrado*100).toFixed(2):'0'}% del cobrado</div><div class="kbar"><div class="kfill" style="background:var(--orange);width:${totCobrado>0?Math.min(totComisiones/totCobrado*100,100).toFixed(0):0}%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">A Pagar (Clientes)</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💵</div></div><div class="kpi-val" style="color:var(--green)">${fmtTPV(totAPagar)}</div><div class="kpi-d dnu">Pagado: ${fmtTPV(totPagadoClientes)} (${totAPagar>0?(totPagadoClientes/totAPagar*100).toFixed(1):'0'}%)</div><div class="kbar"><div class="kfill" style="background:var(--green);width:${totAPagar>0?Math.min(totPagadoClientes/totAPagar*100,100).toFixed(0):0}%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--purple)"><div class="kpi-top"><div class="kpi-lbl">Com. Promotor</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">🤝</div></div><div class="kpi-val" style="color:var(--purple)">${fmtTPV(comPromotor)}</div><div class="kpi-d dnu">Tasas comisionista — Pagado: ${fmtTPV(pagadoPromotor)}</div><div class="kbar"><div class="kfill" style="background:var(--purple);width:${comPromotor>0?Math.min(pagadoPromotor/comPromotor*100,100).toFixed(0):0}%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--red)"><div class="kpi-top"><div class="kpi-lbl">Pendiente Total</div><div class="kpi-ico" style="background:var(--red-bg);color:var(--red)">⏳</div></div><div class="kpi-val" style="color:var(--red)">${fmtTPV(totalPending)}</div><div class="kpi-d dnu">Clientes: ${fmtTPV(totSaldoClientes)} + Com: ${fmtTPV(pendientePromotor)}</div><div class="kbar"><div class="kfill" style="background:var(--red);width:${totalOwed>0?Math.min(totalPending/totalOwed*100,100).toFixed(0):0}%"></div></div></div>`;

  // Client Breakdown Table
  const tbody=document.getElementById('prom-clients-tbody');
  if(tbody){
    const tTitle=document.getElementById('prom-clients-title');
    if(tTitle)tTitle.textContent=`Clientes de ${selName} (${rows.length})`;
    tbody.innerHTML=rows.length?rows.map(p=>{
      const pctPaid=p.a_pagar>0?(p._pagado/p.a_pagar*100):0;
      const est=p._saldo<=0
        ?'<span class="pill" style="background:var(--green-lt);color:#007a48">✓ Al día</span>'
        :pctPaid>0?'<span class="pill" style="background:var(--yellow-lt);color:#7a5000">Parcial</span>'
        :'<span class="pill" style="background:var(--red-lt);color:#b02020">Pendiente</span>';
      const histBadge=p._nPagos>0?`<span style="font-size:.6rem;background:var(--blue-bg);color:var(--blue);border-radius:10px;padding:1px 6px;font-weight:700">${p._nPagos}</span>`:'';
      return `<tr>
        <td class="bld" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.cliente}</td>
        <td class="mo r">${fmtTPVFull(p.total_cobrado,2)}</td>
        <td class="mo r" style="color:var(--orange)">${fmtTPVFull(p.total_comisiones,2)}</td>
        <td class="mo r bld" style="color:var(--green)">${fmtTPVFull(p.a_pagar,2)}</td>
        <td class="mo r">${p._pagado>0?fmtTPVFull(p._pagado,2):'<span style="color:var(--muted)">—</span>'}</td>
        <td class="mo r" style="color:${p._saldo>0.01?'var(--red)':'var(--green)'}">${p._saldo>0.01?fmtTPVFull(p._saldo,2):'✓ $0'}</td>
        <td>${est}</td>
        <td style="text-align:center;white-space:nowrap">
          <button onclick="openHistorial(${p.id})" title="Historial" style="background:none;border:none;cursor:pointer;font-size:.8rem;color:var(--muted);padding:2px 4px">🕐${histBadge}</button>
          <button onclick="openPagoModal(${p.id})" style="background:var(--blue);color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:.68rem;font-weight:700;cursor:pointer;font-family:'Figtree',sans-serif">+ Pago</button>
        </td></tr>`;
    }).join(''):'<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted)">Sin clientes con actividad en este periodo</td></tr>';
  }

  // Comision del Promotor Section
  const comTitle=document.getElementById('prom-com-title');
  if(comTitle)comTitle.textContent=`Comisión de ${selName}`;
  const comKpis=document.getElementById('prom-com-kpis');
  if(comKpis)comKpis.innerHTML=`
    <div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">Com. Comisionista</div><div class="m-kpi-val" style="color:var(--purple)">${fmtTPVFull(comPromotor,2)}</div></div>
    <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Pagado</div><div class="m-kpi-val" style="color:var(--green)">${fmtTPVFull(pagadoPromotor,2)}</div></div>
    <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Pendiente</div><div class="m-kpi-val" style="color:var(--red)">${fmtTPVFull(pendientePromotor,2)}</div></div>`;
  const comTbody=document.getElementById('prom-com-tbody');
  if(comTbody)comTbody.innerHTML=`
    <tr><td class="bld">Comisión comisionista (sum tasas rate_comisionista)</td><td class="mo r bld" style="color:var(--purple)">${fmtTPVFull(comPromotor,2)}</td></tr>
    <tr><td>Pagado</td><td class="mo r" style="color:var(--green)">${fmtTPVFull(pagadoPromotor,2)}</td></tr>
    <tr style="border-top:2px solid var(--border)"><td style="color:var(--red);font-weight:600">Pendiente de pago</td><td class="mo r bld" style="color:var(--red)">${fmtTPVFull(pendientePromotor,2)}</td></tr>`;

  // Pagos al Promotor
  const promPData=promPagosLoad();
  const pagos=(promPData[selName]||[]).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  const pagosTitle=document.getElementById('prom-pagos-title');
  if(pagosTitle)pagosTitle.textContent=`Pagos a ${selName} (${pagos.length})`;
  const pagosTbody=document.getElementById('prom-pagos-tbody');
  if(pagosTbody){
    pagosTbody.innerHTML=pagos.length?pagos.map(p=>
      `<tr><td class="bld">${p.fecha}</td><td class="mo r" style="color:var(--green)">${fmtTPVFull(p.monto)}</td><td style="color:var(--muted);font-size:.72rem">${p.ref||'—'}</td><td style="color:var(--muted);font-size:.66rem">${p.registrado}</td><td><button onclick="deletePromPago('${selName.replace(/'/g,"\\'")}',${p.id})" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:.75rem" title="Eliminar">🗑</button></td></tr>`
    ).join(''):'<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted);font-size:.8rem">Sin pagos registrados</td></tr>';
  }

  // Resumen Consolidado
  const totalsEl=document.getElementById('prom-totals');
  if(totalsEl){
    totalsEl.style.display='';
    totalsEl.innerHTML=`
      <div style="font-weight:700;font-size:.82rem;margin-bottom:10px">📋 Resumen Consolidado</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:.75rem">
        <div style="padding:10px;background:var(--bg);border-radius:8px;text-align:center">
          <div style="color:var(--muted);font-size:.65rem;margin-bottom:4px">Total Adeudado</div>
          <div style="font-weight:700;color:var(--text);font-size:.9rem">${fmtTPVFull(totalOwed,2)}</div>
          <div style="color:var(--muted);font-size:.6rem;margin-top:2px">Clientes: ${fmtTPV(totAPagar)} + Com: ${fmtTPV(comPromotor)}</div>
        </div>
        <div style="padding:10px;background:var(--green-bg);border-radius:8px;text-align:center">
          <div style="color:var(--green);font-size:.65rem;margin-bottom:4px">Total Pagado</div>
          <div style="font-weight:700;color:var(--green);font-size:.9rem">${fmtTPVFull(totalPaid,2)}</div>
          <div style="color:var(--muted);font-size:.6rem;margin-top:2px">${totalOwed>0?(totalPaid/totalOwed*100).toFixed(1):0}% completado</div>
        </div>
        <div style="padding:10px;background:var(--red-bg);border-radius:8px;text-align:center">
          <div style="color:var(--red);font-size:.65rem;margin-bottom:4px">Total Pendiente</div>
          <div style="font-weight:700;color:var(--red);font-size:.9rem">${fmtTPVFull(totalPending,2)}</div>
          <div style="color:var(--muted);font-size:.6rem;margin-top:2px">${rows.filter(r=>r._saldo>0).length} clientes + comisión</div>
        </div>
      </div>`;
  }
}

function openPromPagoModal(){
  if(!_promSelectedName){toast('⚠️ Selecciona un promotor');return;}
  const ov=document.getElementById('prom-pago-overlay');
  if(!ov){
    // Create modal dynamically
    const d=document.createElement('div');d.id='prom-pago-overlay';
    d.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999';
    d.innerHTML=`<div style="background:var(--white);border-radius:14px;padding:24px;width:400px;max-width:90vw">
      <div style="font-weight:700;font-size:.88rem;margin-bottom:14px">💰 Pago Comisión a <span id="prom-pago-name"></span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div><label style="font-size:.68rem;color:var(--muted)">Fecha</label><input type="date" id="prom-pago-fecha" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;background:var(--bg);color:var(--text)"></div>
        <div><label style="font-size:.68rem;color:var(--muted)">Monto</label><input type="number" id="prom-pago-monto" step="0.01" placeholder="$0.00" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;background:var(--bg);color:var(--text)"></div>
      </div>
      <div style="margin-bottom:14px"><label style="font-size:.68rem;color:var(--muted)">Referencia</label><input type="text" id="prom-pago-ref" placeholder="Transferencia, cheque..." style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;background:var(--bg);color:var(--text)"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-out" onclick="document.getElementById('prom-pago-overlay').style.display='none'" style="font-size:.75rem">Cancelar</button>
        <button class="btn btn-blue edit-action" onclick="submitPromPago()" style="font-size:.75rem">✅ Registrar</button>
      </div>
    </div>`;
    document.body.appendChild(d);
  }
  document.getElementById('prom-pago-overlay').style.display='flex';
  document.getElementById('prom-pago-name').textContent=_promSelectedName;
  document.getElementById('prom-pago-fecha').value=new Date().toISOString().slice(0,10);
  document.getElementById('prom-pago-monto').value='';
  document.getElementById('prom-pago-ref').value='';
}

function submitPromPago(){
  const fecha=document.getElementById('prom-pago-fecha').value;
  const monto=parseFloat(document.getElementById('prom-pago-monto').value);
  const ref=document.getElementById('prom-pago-ref').value.trim();
  if(!fecha||!monto||monto<=0){toast('⚠️ Completa fecha y monto');return;}
  const data=promPagosLoad();
  if(!data[_promSelectedName])data[_promSelectedName]=[];
  data[_promSelectedName].push({id:Date.now(),fecha,monto,ref,registrado:new Date().toLocaleString('es-MX')});
  promPagosSave(data);
  toast(`✅ Pago de ${fmtTPVFull(monto)} a ${_promSelectedName}`);
  document.getElementById('prom-pago-overlay').style.display='none';
  rTPVPromotoresDetail();
}

function deletePromPago(promName,pagoId){
  customConfirm('¿Eliminar este pago de comisión?','Eliminar',()=>{
    const data=promPagosLoad();
    if(data[promName]){data[promName]=data[promName].filter(p=>p.id!==pagoId);if(!data[promName].length)delete data[promName];}
    promPagosSave(data);
    toast('🗑 Pago eliminado');
    rTPVPromotoresDetail();
  });
}

function exportPromotoresCSV(){
  if(!_promClientRows.length){toast('⚠️ No hay datos');return;}
  const bom='\uFEFF';
  let csv=bom+'Cliente,Cobrado,Comisiones,A Pagar,Pagado,Saldo,Com Promotor\n';
  _promClientRows.forEach(r=>{csv+=`"${r.cliente}",${r.total_cobrado.toFixed(2)},${r.total_comisiones.toFixed(2)},${r.a_pagar.toFixed(2)},${r._pagado.toFixed(2)},${r._saldo.toFixed(2)},${r.com_comisionista.toFixed(2)}\n`;});
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`promotor_${_promSelectedName}_${new Date().toISOString().slice(0,10)}.csv`;a.click();
  toast('✅ CSV exportado');
}

// ── WRAPPER: Vista unificada Terminales + Cambios ──
async function rTPVTerminalesView(){
  await rTPVTerminales();
  await rTPVCambios();
}

async function rTPVTerminales(){
  const tbody=document.getElementById('term-tbody');if(!tbody)return;
  const terms = await TPV.terminalStatus() || [];
  _termAllData = terms; // store for filtering
  // Populate client dropdown + search cache
  const clientes = [...new Set(terms.map(t => t.cliente))].sort();
  _termClienteOptions = clientes.map(c => ({ value: c, label: c }));
  const clienteFilter = document.getElementById('term-cliente-filter');
  if (clienteFilter) {
    const prev = clienteFilter.value;
    clienteFilter.innerHTML = '<option value="">Todos los clientes</option>' +
      clientes.map(c => `<option value="${c}" ${c === prev ? 'selected' : ''}>${c}</option>`).join('');
  }
  const termSearchEl = document.getElementById('term-search');
  if (termSearchEl) termSearchEl.value = '';
  // KPIs
  const numTerm = new Set(terms.map(t=>t.terminal_id)).size;
  const totIng = terms.reduce((s,t)=>s+parseFloat(t.ingresos||0),0);
  const totTxn = terms.reduce((s,t)=>s+parseInt(t.transacciones||0),0);
  const avgTicket = totTxn > 0 ? totIng / totTxn : 0;
  const kEl=document.getElementById('tpv-term-kpis');
  if(kEl)kEl.innerHTML=`
    <div class="kpi-card" style="--ac:#0073ea"><div class="kpi-top"><div class="kpi-lbl">Terminales</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">🖥️</div></div><div class="kpi-val" style="color:#0073ea">${numTerm}</div><div class="kpi-d dnu">Total registradas</div><div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">Ingresos</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💰</div></div><div class="kpi-val" style="color:var(--green)">${fmtTPV(totIng)}</div><div class="kpi-d dnu">Total período</div><div class="kbar"><div class="kfill" style="background:var(--green);width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--purple)"><div class="kpi-top"><div class="kpi-lbl">Transacciones</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">🔢</div></div><div class="kpi-val" style="color:var(--purple)">${totTxn.toLocaleString()}</div><div class="kpi-d dnu">Pagos procesados</div><div class="kbar"><div class="kfill" style="background:var(--purple);width:100%"></div></div></div>
    <div class="kpi-card" style="--ac:var(--orange)"><div class="kpi-top"><div class="kpi-lbl">Ticket Promedio</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">🎫</div></div><div class="kpi-val" style="color:var(--orange)">$${avgTicket.toFixed(0)}</div><div class="kpi-d dnu">Por transacción</div><div class="kbar"><div class="kfill" style="background:var(--orange);width:65%"></div></div></div>`;
  // Count active/inactive/warning
  const activas = terms.filter(t=>(parseInt(t.dias_sin_uso)||0)<=14).length;
  const warning = terms.filter(t=>{const d=parseInt(t.dias_sin_uso)||0; return d>14&&d<=30;}).length;
  const inactivas = terms.filter(t=>(parseInt(t.dias_sin_uso)||0)>30).length;
  const numClientes = new Set(terms.map(t=>t.cliente)).size;
  const sub=document.getElementById('tpv-term-subtitle');
  if(sub)sub.innerHTML=`${numTerm} terminales · ${numClientes} clientes · <span style="color:var(--green);font-weight:600">${activas} activas</span> · <span style="color:var(--orange)">${warning} alerta</span> · <span style="color:var(--red)">${inactivas} inactivas</span>`;
  tbody.innerHTML=terms.map(t=>{
    const dias=parseInt(t.dias_sin_uso)||0;
    const badge=dias<=14?'<span class="tpv-badge-ok">Activa</span>':dias<=30?`<span class="tpv-badge-warn">${dias}d sin uso</span>`:`<span class="tpv-badge-inact">Inactiva ${dias}d</span>`;
    const tid=t.terminal_id&&t.terminal_id!=='-'&&t.terminal_id!=='None'?`<span style="font-family:monospace;font-size:.67rem;color:var(--muted)">${t.terminal_id.slice(-10)}</span>`:'—';
    return`<tr>
      <td class="bld">${t.cliente}</td>
      <td class="mo" style="text-align:center">${t.num_term}</td>
      <td>${tid}</td>
      <td style="font-size:.73rem">${t.ultimo_uso||'—'}</td>
      <td class="mo pos bld">${parseFloat(t.ingresos)>0?fmtTPVFull(t.ingresos):'—'}</td>
      <td class="mo" style="text-align:center">${parseInt(t.transacciones)>0?parseInt(t.transacciones).toLocaleString():'—'}</td>
      <td class="mo">${parseFloat(t.promedio)>0?'$'+parseFloat(t.promedio).toFixed(0):'—'}</td>
      <td class="mo" style="text-align:center;color:${dias>30?'var(--red)':dias>14?'var(--orange)':'var(--green)'}">${dias||'—'}</td>
      <td>${badge}</td></tr>`;
  }).join('');
  // Terminal charts
  setTimeout(()=>{
    const isDark=document.body.classList.contains('dark');
    const textC=isDark?'#9da0c5':'#8b8fb5';
    const gridC=isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';
    // Top 10 bar chart
    const top10=terms.slice(0,10);
    if(TPV_CHARTS['term_top'])TPV_CHARTS['term_top'].destroy();
    const c1=document.getElementById('c-tpv-term-top');
    if(c1){TPV_CHARTS['term_top']=new Chart(c1,{type:'bar',
      data:{labels:top10.map(t=>(t.cliente||'').substring(0,16)),datasets:[{data:top10.map(t=>parseFloat(t.ingresos)),backgroundColor:'#0073ea22',borderColor:'#0073ea',borderWidth:1.5,borderRadius:4}]},
      options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{color:gridC},ticks:{color:textC,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1000?'$'+(v/1000).toFixed(0)+'K':'$'+v}},y:{grid:{display:false},ticks:{color:textC,font:{size:8}}}}}
    });}
    // Status doughnut
    if(TPV_CHARTS['term_status'])TPV_CHARTS['term_status'].destroy();
    const c2=document.getElementById('c-tpv-term-status');
    if(c2){TPV_CHARTS['term_status']=new Chart(c2,{type:'doughnut',
      data:{labels:['Activas (≤14d)','Alerta (15-30d)','Inactivas (>30d)'],datasets:[{data:[activas,warning,inactivas],backgroundColor:['#00b875','#ffa000','#e53935'],borderWidth:0}]},
      options:{cutout:'65%',plugins:{legend:{position:'bottom',labels:{font:{size:9},color:textC,boxWidth:10,padding:8}}}}
    });}
  },50);
}

async function rTPVCambios(){
  const tbody=document.getElementById('cambios-tbody');if(!tbody)return;
  const cambios = await TPV.terminalChanges() || [];
  const numSolap = cambios.filter(c=>(c.tipo||'').includes('⚠️')).length;
  const numTerminals = new Set(cambios.map(c=>c.terminal)).size;
  // KPIs
  const kEl=document.getElementById('tpv-cambios-kpis');
  if(kEl){
    const pctSolap = cambios.length > 0 ? (numSolap / cambios.length * 100).toFixed(1) : '0.0';
    kEl.innerHTML=`
      <div class="kpi-card" style="--ac:var(--orange)"><div class="kpi-top"><div class="kpi-lbl">Terminales con Cambio</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">🔄</div></div><div class="kpi-val" style="color:var(--orange)">${numTerminals}</div><div class="kpi-d dnu">Terminales reasignadas</div><div class="kbar"><div class="kfill" style="background:var(--orange);width:100%"></div></div></div>
      <div class="kpi-card" style="--ac:#0073ea"><div class="kpi-top"><div class="kpi-lbl">Cambios Detectados</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">📋</div></div><div class="kpi-val" style="color:#0073ea">${cambios.length}</div><div class="kpi-d dnu">Movimientos registrados</div><div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div></div>
      <div class="kpi-card" style="--ac:var(--red)"><div class="kpi-top"><div class="kpi-lbl">⚠️ Solapamientos</div><div class="kpi-ico" style="background:var(--red-bg);color:var(--red)">🚨</div></div><div class="kpi-val" style="color:var(--red)">${numSolap}</div><div class="kpi-d dnu">${pctSolap}% del total</div><div class="kbar"><div class="kfill" style="background:var(--red);width:${pctSolap}%"></div></div></div>`;
  }
  const numLimpios = cambios.length - numSolap;
  const sub=document.getElementById('tpv-cambios-subtitle');
  if(sub)sub.innerHTML=cambios.length > 0
    ? `${cambios.length} cambios detectados · <span style="color:var(--green);font-weight:600">✅ ${numLimpios} limpios</span> · <span style="color:var(--red);font-weight:600">⚠️ ${numSolap} solapamientos</span>`
    : 'No se detectaron cambios de terminal entre clientes';
  if (cambios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:30px;color:var(--muted);font-size:.8rem">✅ No se detectaron reasignaciones de terminales entre clientes. Todas las terminales mantienen su asignación original.</td></tr>';
    return;
  }
  tbody.innerHTML=cambios.map(c=>{
    const badge=(c.tipo||'').includes('⚠️')?'<span class="tpv-badge-warn">⚠️ Solapamiento</span>':'<span class="tpv-badge-ok">✅ Limpio</span>';
    const tid=c.terminal?c.terminal.slice(-12):'-';
    return`<tr style="${(c.tipo||'').includes('⚠️')?'background:rgba(255,152,0,.04)':''}">
      <td style="color:var(--muted);font-size:.72rem">${c.num}</td>
      <td><span style="font-family:monospace;font-size:.67rem;color:var(--muted)">${tid}</span></td>
      <td class="bld">${c.cliente_ant||'—'}</td>
      <td style="font-size:.73rem">${c.fecha_ant_ini||''}</td>
      <td style="font-size:.73rem">${c.fecha_ant_fin||''}</td>
      <td class="mo" style="text-align:center">${c.txns_ant||0}</td>
      <td class="mo">${parseFloat(c.monto_ant)>0?fmtTPVFull(c.monto_ant):'—'}</td>
      <td>${badge}</td>
      <td class="bld" style="color:#0073ea">${c.cliente_act||'—'}</td>
      <td style="font-size:.73rem">${c.fecha_act_ini||''}</td>
      <td style="font-size:.73rem">${c.fecha_act_fin||''}</td>
      <td class="mo" style="text-align:center">${c.txns_act||0}</td></tr>`;
  }).join('');
}


// ==============================
// TPV CHARTS
// ==============================
const TPV_CHARTS = {};

// Charts now integrated into initTPVGeneral(), initTPVDashboard() and rTPVAgentes()
// Old standalone chart functions removed



// ==============================
// TPV PAGOS — CAPTURA & LOCALSTORAGE
// ==============================

const PAGOS_KEY = 'gf_tpv_pagos';

// Load payments from localStorage
function pagosLoad() {
  try { return DB.get(PAGOS_KEY) || {}; }
  catch(e) { return {}; }
}

// Save payments to localStorage
function pagosSave(data) {
  DB.set(PAGOS_KEY, data);
}

// Get total paid for a client id (excludes voided payments)
function pagosTotalCliente(id, data) {
  const pagos = (data[id] || []);
  return pagos.filter(p => !p.anulado).reduce((s, p) => s + p.monto, 0);
}

// Get effective saldo for a client (a_pagar = cobrado - comisiones, minus what's been paid)
function pagosSaldo(cliente) {
  const data = pagosLoad();
  const pagado = pagosTotalCliente(cliente.id, data);
  const aPagar = cliente.a_pagar || (parseFloat(cliente.total_cobrado||0) - parseFloat(cliente.total_comisiones||0));
  return Math.max(0, aPagar - pagado);
}

// ── WRAPPER: Vista unificada Pagos + Historial ──
async function rTPVPagosView(){
  await rTPVPagos();
  await rTPVHistorial();
}

// ── RENDER rTPVPagos ──
async function rTPVPagos() {
  const tbody = document.getElementById('pagos-tbody');
  if (!tbody) return;

  const data = pagosLoad();
  const today = new Date().toLocaleDateString('es-MX');

  // Get date range from pickers (if available)
  const fromDate = document.getElementById('pagos-from')?.value || null;
  const toDate = document.getElementById('pagos-to')?.value || null;
  const periodText = fromDate && toDate ? `${fromDate} → ${toDate}` : 'Histórico completo';

  // Load client commissions from Supabase for the selected period
  const comData = await TPV.clientCommissions(fromDate, toDate) || [];

  // Calculate effective totals with corrected data model:
  // total_cobrado = what clients' customers paid
  // monto_neto (from RPC) = sum of all commissions
  // a_pagar = total_cobrado - monto_neto = what we owe client
  let totCobrado = 0, totComisiones = 0, totAPagar = 0, totPagado = 0, totPend = 0, conSaldo = 0;
  const rows = comData.map(p => {
    const cobrado = parseFloat(p.total_cobrado) || 0;
    const comTotal = parseFloat(p.monto_neto) || 0;
    const aPagar = cobrado - comTotal;
    const pagado = pagosTotalCliente(p.client_id, data);
    const saldo = Math.max(0, aPagar - pagado);
    totCobrado += cobrado;
    totComisiones += comTotal;
    totAPagar += aPagar;
    totPagado += pagado;
    totPend += saldo;
    if (saldo > 0) conSaldo++;
    return {
      id: p.client_id, cliente: p.cliente,
      total_cobrado: cobrado, total_comisiones: comTotal,
      com_efevoo: parseFloat(p.com_efevoo)||0, com_salem: parseFloat(p.com_salem)||0,
      com_convenia: parseFloat(p.com_convenia)||0, com_comisionista: parseFloat(p.com_comisionista)||0,
      a_pagar: aPagar, _totalPagado: pagado, _saldo: saldo,
      _nPagos: (data[p.client_id] || []).length,
      _rate_corrected: p._rate_corrected || false
    };
  });

  // Store in cache for modal functions
  _tpvPagosCache = rows;

  // KPIs
  const kEl = document.getElementById('tpv-pagos-kpis');
  if (kEl) kEl.innerHTML = `
    <div class="kpi-card" style="--ac:#0073ea">
      <div class="kpi-top"><div class="kpi-lbl">Total Cobrado</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">💰</div></div>
      <div class="kpi-val" style="color:#0073ea">${fmtTPV(totCobrado)}</div>
      <div class="kpi-d dnu">${comData.length} clientes · ${periodText}</div>
      <div class="kbar"><div class="kfill" style="background:#0073ea;width:100%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:var(--orange)">
      <div class="kpi-top"><div class="kpi-lbl">Total Comisiones</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">📊</div></div>
      <div class="kpi-val" style="color:var(--orange)">${fmtTPV(totComisiones)}</div>
      <div class="kpi-d dnu">${totCobrado > 0 ? (totComisiones/totCobrado*100).toFixed(2) : '0.0'}% del cobrado</div>
      <div class="kbar"><div class="kfill" style="background:var(--orange);width:${totCobrado>0?Math.min(totComisiones/totCobrado*100,100).toFixed(0):0}%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:var(--green)">
      <div class="kpi-top"><div class="kpi-lbl">A Pagar (Clientes)</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💵</div></div>
      <div class="kpi-val" style="color:var(--green)">${fmtTPV(totAPagar)}</div>
      <div class="kpi-d dnu">Pagado: ${fmtTPV(totPagado)} (${totAPagar>0?(totPagado/totAPagar*100).toFixed(1):'0'}%)</div>
      <div class="kbar"><div class="kfill" style="background:var(--green);width:${totAPagar>0?Math.min(totPagado/totAPagar*100,100).toFixed(0):0}%"></div></div>
    </div>
    <div class="kpi-card" style="--ac:var(--red)">
      <div class="kpi-top"><div class="kpi-lbl">Saldo Pendiente</div><div class="kpi-ico" style="background:var(--red-bg);color:var(--red)">⏳</div></div>
      <div class="kpi-val" style="color:var(--red)">${fmtTPV(totPend)}</div>
      <div class="kpi-d dnu">${conSaldo} clientes con saldo</div>
      <div class="kbar"><div class="kfill" style="background:var(--red);width:${totAPagar>0?Math.min(totPend/totAPagar*100,100).toFixed(0):0}%"></div></div>
    </div>
  `;

  // Update timestamp
  const upd = document.getElementById('pagos-last-update');
  if (upd) upd.textContent = 'Actualizado: ' + today;

  // Table rows - corrected columns
  tbody.innerHTML = rows.filter(p => p.a_pagar > 0 || p._totalPagado > 0).map((p, i) => {
    const pct = p.a_pagar > 0 ? (p._totalPagado / p.a_pagar * 100) : 0;
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
        <button onclick="openHistorial(${p.id})" title="Ver historial" style="background:none;border:none;cursor:pointer;font-size:.8rem;color:var(--muted);padding:2px 4px;border-radius:4px;${p._nPagos===0?'opacity:.35':''}">🕐${histBtn}</button>
      </td>
      <td class="bld" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.cliente}${p._rate_corrected ? ' <span title="Comisiones corregidas por cambio de tasa histórica" style="font-size:.55rem;background:var(--purple-bg);color:var(--purple);border-radius:6px;padding:1px 5px;font-weight:700;cursor:help;vertical-align:middle">📊 Ajuste</span>' : ''}</td>
      <td class="mo">${fmtTPVFull(p.total_cobrado,2)}</td>
      <td class="mo" style="color:var(--orange)">${fmtTPVFull(p.total_comisiones,2)}</td>
      <td class="mo bld pos">${fmtTPVFull(p.a_pagar,2)}</td>
      <td class="mo pos">${p._totalPagado > 0 ? fmtTPVFull(p._totalPagado,2) : '<span style="color:var(--muted)">—</span>'}</td>
      <td class="mo ${p._saldo > 0 ? 'neg' : 'pos'}">${p._saldo > 0.01 ? fmtTPVFull(p._saldo,2) : '<span style="color:var(--green)">✓ $0</span>'}</td>
      <td>${est}</td>
      <td style="text-align:center">
        <button onclick="openPagoModal(${p.id})" style="background:var(--blue);color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:.68rem;font-weight:700;cursor:pointer;font-family:'Figtree',sans-serif">+ Pago</button>
      </td>
    </tr>`;
  }).join('');

  // Show correction info banner if any clients have rate corrections
  const correctedCount = rows.filter(r => r._rate_corrected).length;
  const pagosView = document.getElementById('view-tpv_pagos');
  let banner = document.getElementById('rate-corr-banner');
  if (correctedCount > 0) {
    if (!banner && pagosView) {
      banner = document.createElement('div');
      banner.id = 'rate-corr-banner';
      pagosView.appendChild(banner);
    }
    if (banner) banner.innerHTML = `<div style="margin-top:10px;padding:8px 14px;background:var(--purple-bg);border-radius:8px;font-size:.7rem;color:var(--purple);display:flex;align-items:center;gap:8px">
      <span>📊</span>
      <span><b>${correctedCount} cliente${correctedCount > 1 ? 's' : ''}</b> con comisiones ajustadas por cambios de tasa históricos.</span>
      <button onclick="openRateChanges()" style="background:var(--purple);color:#fff;border:none;border-radius:5px;padding:3px 10px;font-size:.65rem;font-weight:700;cursor:pointer;font-family:'Figtree',sans-serif;white-space:nowrap">Ver Historial</button>
    </div>`;
  } else if (banner) {
    banner.innerHTML = '';
  }
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

  // Populate client selector + search cache
  const sel = document.getElementById('pago-cliente-sel');
  const wrap = document.getElementById('pago-cliente-wrap');
  const eligibleClients = _tpvPagosCache.filter(p => (p.total_cobrado || 0) > 0);
  _pagoClienteAllOptions = eligibleClients.map(p => ({ value: String(p.id), label: p.cliente }));
  sel.innerHTML = '<option value="">— Seleccionar cliente —</option>' +
    eligibleClients.map(p =>
      `<option value="${p.id}" ${p.id === clienteId ? 'selected' : ''}>${p.cliente}</option>`
    ).join('');
  const pagoSearchEl = document.getElementById('pago-cliente-search');
  if (pagoSearchEl) pagoSearchEl.value = '';

  if (clienteId !== null) {
    const cli = _tpvPagosCache.find(p => p.id === clienteId);
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
  const cli = _tpvPagosCache.find(p => p.id === selId);
  if (!cli) return;
  const saldo = pagosSaldo(cli);
  document.getElementById('pago-saldo-val').textContent = fmtTPVFull(saldo, 2);
  info.style.display = '';
  // Show/hide the "pagar total" button
  const btnTotal = document.getElementById('pago-llenar-total');
  if (btnTotal) btnTotal.style.display = saldo > 0 ? '' : 'none';
}

function pagoValidateMonto() {
  const selId = _pagoClienteId || parseInt(document.getElementById('pago-cliente-sel').value);
  const monto = parseFloat(document.getElementById('pago-monto').value) || 0;
  const warn = document.getElementById('pago-monto-warn');
  if (!selId) { warn.style.display = 'none'; return; }
  const cli = _tpvPagosCache.find(p => p.id === selId);
  const saldo = pagosSaldo(cli);
  warn.style.display = (monto > saldo + 0.01) ? '' : 'none';
}

/** Fill the monto field with the full pending amount */
function pagoLlenarTotal() {
  const selId = _pagoClienteId || parseInt(document.getElementById('pago-cliente-sel').value);
  if (!selId) return;
  const cli = _tpvPagosCache.find(p => p.id === selId);
  if (!cli) return;
  const saldo = pagosSaldo(cli);
  document.getElementById('pago-monto').value = saldo.toFixed(2);
  pagoValidateMonto();
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

  const cli = _tpvPagosCache.find(p => p.id === selId);
  toast(`✅ Pago de ${fmtTPVFull(monto)} registrado — ${cli?.cliente || ''}`);
  closePagoModal();
  rTPVPagos();
  if(_currentView==='tpv_promotores') rTPVPromotoresDetail();
}

// ── HISTORIAL MODAL ──
function openHistorial(clienteId) {
  const cli = _tpvPagosCache.find(p => p.id === clienteId);
  if (!cli) return;

  const data = pagosLoad();
  const pagos = (data[clienteId] || []).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const totalPagado = pagos.reduce((s, p) => s + p.monto, 0);
  const aPagar = cli.a_pagar || (parseFloat(cli.total_cobrado||0) - parseFloat(cli.total_comisiones||0));
  const saldo = Math.max(0, aPagar - totalPagado);

  document.getElementById('hist-title').textContent = '🕐 Historial de Pagos — ' + cli.cliente;
  document.getElementById('hist-subtitle').textContent = `${pagos.length} pago${pagos.length !== 1 ? 's' : ''} registrado${pagos.length !== 1 ? 's' : ''}`;

  // KPIs del historial: Cobrado, Comisiones, A Pagar, Pagado, Saldo
  document.getElementById('hist-kpis').innerHTML = `
    <div class="m-kpi" style="--ac:#0073ea"><div class="m-kpi-lbl">Total Cobrado</div><div class="m-kpi-val" style="color:#0073ea">${fmtTPVFull(cli.total_cobrado||0)}</div></div>
    <div class="m-kpi" style="--ac:var(--orange)"><div class="m-kpi-lbl">Comisiones</div><div class="m-kpi-val" style="color:var(--orange)">${fmtTPVFull(cli.total_comisiones||0)}</div></div>
    <div class="m-kpi" style="--ac:var(--purple)"><div class="m-kpi-lbl">A Pagar</div><div class="m-kpi-val" style="color:var(--purple)">${fmtTPVFull(aPagar)}</div></div>
    <div class="m-kpi" style="--ac:var(--green)"><div class="m-kpi-lbl">Pagado</div><div class="m-kpi-val" style="color:var(--green)">${fmtTPVFull(totalPagado)}</div></div>
    <div class="m-kpi" style="--ac:var(--red)"><div class="m-kpi-lbl">Saldo</div><div class="m-kpi-val" style="color:var(--red)">${fmtTPVFull(saldo)}</div></div>
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
  _tpvPagosCache.forEach(cli => {
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



// ── HISTORIAL DE PAGOS (vista global) ──
let _historialCache = [];
let _historialFiltered = [];

async function rTPVHistorial() {
  const data = pagosLoad();

  // Build client name map — try _tpvPagosCache first, fallback to TPV.getClients()
  let clientMap = {};
  if (_tpvPagosCache && _tpvPagosCache.length > 0) {
    _tpvPagosCache.forEach(c => { clientMap[c.id] = c.cliente; });
  } else {
    try {
      const clients = await TPV.getClients();
      if (clients) clients.forEach(c => { clientMap[c.id] = c.nombre_display || c.nombre; });
    } catch(e) {}
  }

  // Flatten payments: {clienteId: [pagos]} → [{clienteId, cliente, ...pago}]
  const flat = [];
  for (const cid in data) {
    const nombre = clientMap[cid] || clientMap[parseInt(cid)] || 'Cliente #' + cid;
    (data[cid] || []).forEach(p => {
      flat.push({ clienteId: cid, cliente: nombre, ...p });
    });
  }
  flat.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || b.id - a.id);
  _historialCache = flat;

  // Populate client filter dropdown
  const sel = document.getElementById('hist-pg-cliente');
  if (sel) {
    const uniqueClients = [...new Map(flat.map(p => [p.clienteId, p.cliente])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1]));
    sel.innerHTML = '<option value="">Todos</option>' +
      uniqueClients.map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
  }

  // Set default dates (current month)
  const fromEl = document.getElementById('hist-pg-from');
  const toEl = document.getElementById('hist-pg-to');
  if (fromEl && !fromEl.value) {
    const now = new Date();
    fromEl.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
    toEl.value = now.toISOString().split('T')[0];
  }

  filterHistorial();
}

function filterHistorial() {
  const fromVal = document.getElementById('hist-pg-from')?.value || '';
  const toVal = document.getElementById('hist-pg-to')?.value || '';
  const clienteVal = document.getElementById('hist-pg-cliente')?.value || '';
  const destinoVal = document.getElementById('hist-pg-destino')?.value || '';

  let filtered = _historialCache;
  if (fromVal) filtered = filtered.filter(p => p.fecha >= fromVal);
  if (toVal) filtered = filtered.filter(p => p.fecha <= toVal);
  if (clienteVal) filtered = filtered.filter(p => String(p.clienteId) === clienteVal);
  if (destinoVal) filtered = filtered.filter(p => p.destino === destinoVal);

  _historialFiltered = filtered;
  _renderHistorial(filtered);
}

// Filtro rápido: pagos registrados hoy (lo que tesorería debe pagar)
function filterPagosHoy() {
  const hoy = new Date();
  const d = hoy.getDate(), m = hoy.getMonth() + 1, y = hoy.getFullYear();
  // registrado está en formato es-MX: "d/m/yyyy, hh:mm:ss"
  const prefix = d + '/' + m + '/' + y;
  const destinoVal = document.getElementById('hist-pg-destino')?.value || '';

  let filtered = _historialCache.filter(p => {
    if (p.anulado) return false;
    return p.registrado && p.registrado.startsWith(prefix);
  });
  if (destinoVal) filtered = filtered.filter(p => p.destino === destinoVal);

  // Limpiar otros filtros visualmente
  const fromEl = document.getElementById('hist-pg-from');
  const toEl = document.getElementById('hist-pg-to');
  const selEl = document.getElementById('hist-pg-cliente');
  const searchEl = document.getElementById('hist-pg-search');
  if (fromEl) fromEl.value = '';
  if (toEl) toEl.value = '';
  if (selEl) selEl.value = '';
  if (searchEl) searchEl.value = '';

  _historialFiltered = filtered;
  _renderHistorial(filtered);
}

function searchHistorial(q) {
  if (!q) { _renderHistorial(_historialFiltered); return; }
  const lq = q.toLowerCase();
  const results = _historialFiltered.filter(p =>
    (p.cliente || '').toLowerCase().includes(lq) ||
    (p.ref || '').toLowerCase().includes(lq) ||
    (p.fecha || '').includes(lq)
  );
  _renderHistorial(results);
}

function resetHistorialFilters() {
  const fromEl = document.getElementById('hist-pg-from');
  const toEl = document.getElementById('hist-pg-to');
  const selEl = document.getElementById('hist-pg-cliente');
  const searchEl = document.getElementById('hist-pg-search');
  const destEl = document.getElementById('hist-pg-destino');
  if (fromEl) fromEl.value = '';
  if (toEl) toEl.value = '';
  if (selEl) selEl.value = '';
  if (searchEl) searchEl.value = '';
  if (destEl) destEl.value = '';
  _historialFiltered = _historialCache;
  _renderHistorial(_historialCache);
}

function _renderHistorial(rows) {
  const tbody = document.getElementById('hist-pg-tbody');
  if (!tbody) return;

  // KPIs
  const activos = rows.filter(p => !p.anulado);
  const anulados = rows.filter(p => p.anulado);
  const totalMonto = activos.reduce((s, p) => s + (p.monto || 0), 0);
  const tarjeta = activos.filter(p => p.destino === 'tarjeta');
  const banco = activos.filter(p => p.destino === 'banco');
  const montoTarjeta = tarjeta.reduce((s, p) => s + (p.monto || 0), 0);
  const montoBanco = banco.reduce((s, p) => s + (p.monto || 0), 0);
  const kEl = document.getElementById('hist-pg-kpis');
  if (kEl) kEl.innerHTML = `
    <div class="kpi-card" style="--ac:#0073ea">
      <div class="kpi-top"><div class="kpi-lbl">Total Pagos</div><div class="kpi-ico" style="background:var(--blue-bg);color:#0073ea">📋</div></div>
      <div class="kpi-val" style="color:#0073ea">${fmtTPV(totalMonto)}</div>
      <div class="kpi-d dnu">${activos.length} pagos activos${anulados.length ? ' · ' + anulados.length + ' anulados' : ''}</div>
    </div>
    <div class="kpi-card" style="--ac:var(--purple)">
      <div class="kpi-top"><div class="kpi-lbl">💳 Tarjeta</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">💳</div></div>
      <div class="kpi-val" style="color:var(--purple)">${fmtTPV(montoTarjeta)}</div>
      <div class="kpi-d dnu">${tarjeta.length} pago${tarjeta.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="kpi-card" style="--ac:var(--green)">
      <div class="kpi-top"><div class="kpi-lbl">🏦 Banco</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">🏦</div></div>
      <div class="kpi-val" style="color:var(--green)">${fmtTPV(montoBanco)}</div>
      <div class="kpi-d dnu">${banco.length} pago${banco.length !== 1 ? 's' : ''}</div>
    </div>
  `;

  // Table title
  const tt = document.getElementById('hist-pg-table-title');
  if (tt) tt.textContent = `${rows.length} pago${rows.length !== 1 ? 's' : ''} encontrado${rows.length !== 1 ? 's' : ''}`;

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--muted);font-size:.8rem">No hay pagos en el rango seleccionado</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(p => {
    const isAnulado = p.anulado;
    const destPill = p.destino === 'tarjeta'
      ? '<span class="pill" style="background:var(--blue-lt);color:#003d7a">💳 Tarjeta</span>'
      : '<span class="pill" style="background:var(--green-lt);color:#007a48">🏦 Banco</span>';
    const estadoPill = isAnulado
      ? '<span class="pill" style="background:var(--red-lt);color:#b02020">🚫 Anulado</span>'
      : '<span class="pill" style="background:var(--green-lt);color:#007a48">✓ Activo</span>';
    const rowStyle = isAnulado ? 'opacity:.5;text-decoration:line-through' : '';
    const anularBtn = isAnulado
      ? `<span style="font-size:.62rem;color:var(--muted)" title="Anulado el ${p.anulado_fecha||''}">—</span>`
      : `<button onclick="anularPago('${p.clienteId}',${p.id})" style="background:none;border:1px solid var(--red-lt);border-radius:5px;cursor:pointer;color:var(--red);font-size:.65rem;padding:2px 8px;font-family:'Figtree',sans-serif" title="Anular pago">Anular</button>`;
    return `<tr style="${rowStyle}">
      <td class="bld">${p.fecha || '—'}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.cliente}</td>
      <td class="mo r">${fmtTPVFull(p.monto)}</td>
      <td>${destPill}</td>
      <td style="color:var(--muted);font-size:.72rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.ref || '—'}</td>
      <td style="color:var(--muted);font-size:.66rem">${p.registrado || '—'}</td>
      <td>${estadoPill}</td>
      <td style="text-align:center">${anularBtn}</td>
    </tr>`;
  }).join('');
}

// ── ANULAR PAGO ──
function anularPago(clienteId, pagoId) {
  const data = pagosLoad();
  const pagos = data[clienteId] || [];
  const pago = pagos.find(p => p.id === pagoId);
  if (!pago) { toast('⚠️ Pago no encontrado'); return; }

  const montoStr = fmtTPVFull(pago.monto);
  customConfirm(
    `¿Anular pago de ${montoStr} del ${pago.fecha}?\n\nEsta acción marcará el pago como anulado. No se eliminará del historial.`,
    'Anular Pago',
    (ok) => {
      if (!ok) return;
      const d = pagosLoad();
      const p = (d[clienteId] || []).find(x => x.id === pagoId);
      if (p) {
        p.anulado = true;
        p.anulado_fecha = new Date().toLocaleString('es-MX');
        p.anulado_por = (getCurrentUser()?.nombre || 'Admin');
        pagosSave(d);
        toast('🚫 Pago anulado — ' + montoStr);
        rTPVHistorial();
      }
    }
  );
}

// ── EXPORTAR HISTORIAL ──
function exportHistorialCSV() {
  const rows = _historialFiltered || _historialCache;
  if (!rows.length) { toast('⚠️ No hay datos para exportar'); return; }
  let csv = ['Fecha,Cliente,Monto,Destino,Referencia,Registrado,Estado'];
  rows.forEach(p => {
    csv.push(`"${p.fecha}","${p.cliente}",${p.monto},"${p.destino==='tarjeta'?'Tarjeta':'Banco'}","${(p.ref||'').replace(/"/g,'""')}","${p.registrado||''}","${p.anulado?'Anulado':'Activo'}"`);
  });
  const blob = new Blob(['\uFEFF'+csv.join('\n')], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'historial_pagos_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  toast('📥 CSV descargado');
}

function exportHistorialXLSX() {
  const rows = _historialFiltered || _historialCache;
  if (!rows.length) { toast('⚠️ No hay datos para exportar'); return; }
  if (typeof XLSX === 'undefined') { toast('⚠️ Librería XLSX no disponible'); return; }
  const data = rows.map(p => ({
    Fecha: p.fecha,
    Cliente: p.cliente,
    Monto: p.monto,
    Destino: p.destino === 'tarjeta' ? 'Tarjeta' : 'Banco',
    Referencia: p.ref || '',
    Registrado: p.registrado || '',
    Estado: p.anulado ? 'Anulado' : 'Activo'
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{wch:12},{wch:30},{wch:14},{wch:10},{wch:25},{wch:20},{wch:10}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Historial de Pagos');
  XLSX.writeFile(wb, 'historial_pagos_' + new Date().toISOString().split('T')[0] + '.xlsx');
  toast('📥 Excel descargado');
}

function exportHistorialPDF() {
  const rows = _historialFiltered || _historialCache;
  if (!rows.length) { toast('⚠️ No hay datos para exportar'); return; }
  const activos = rows.filter(p => !p.anulado);
  const totalMonto = activos.reduce((s, p) => s + (p.monto || 0), 0);
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Historial de Pagos TPV</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;color:#1a1c2e;font-size:12px}
  h1{font-size:16px;margin:0 0 4px}
  .sub{font-size:11px;color:#666;margin-bottom:16px}
  .kpis{display:flex;gap:20px;margin-bottom:16px}
  .kpi{background:#f5f6fa;padding:8px 14px;border-radius:8px}
  .kpi-lbl{font-size:10px;color:#888;font-weight:600}
  .kpi-val{font-size:16px;font-weight:700}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{background:#f0f2f8;padding:6px 8px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #ddd}
  td{padding:5px 8px;border-bottom:1px solid #eee;font-size:11px}
  .r{text-align:right}
  .anulado{opacity:.5;text-decoration:line-through}
  @media print{body{padding:0}@page{margin:1cm}}
</style></head><body>
<h1>📋 Historial de Pagos TPV</h1>
<div class="sub">Generado: ${new Date().toLocaleString('es-MX')} · ${rows.length} pagos · Monto activo: $${totalMonto.toLocaleString('es-MX',{minimumFractionDigits:2})}</div>
<table>
<thead><tr><th>Fecha</th><th>Cliente</th><th class="r">Monto</th><th>Destino</th><th>Referencia</th><th>Estado</th></tr></thead>
<tbody>${rows.map(p=>`<tr class="${p.anulado?'anulado':''}"><td>${p.fecha}</td><td>${p.cliente}</td><td class="r">$${(p.monto||0).toLocaleString('es-MX',{minimumFractionDigits:2})}</td><td>${p.destino==='tarjeta'?'Tarjeta':'Banco'}</td><td>${p.ref||'—'}</td><td>${p.anulado?'Anulado':'Activo'}</td></tr>`).join('')}</tbody>
</table></body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 300);
  toast('🖨 Preparando impresión...');
}

// ==============================
// TARJETAS CHARTS (Dynamic — TAR data service)
// ==============================
const TAR_CHARTS = {};

function _tarFmt(v) {
  if (v == null || isNaN(v)) return '—';
  const n = Number(v);
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function _tarNum(v) {
  if (v == null || isNaN(v)) return '—';
  return Number(v).toLocaleString('es-MX');
}
function _tarPct(v) {
  if (v == null || isNaN(v)) return '—';
  return Number(v).toFixed(1) + '%';
}
function _tarSetEl(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}
function _tarNoData(canvasId) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#8b8fb5';
  ctx.font = '13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Sin datos', c.width / 2, c.height / 2);
}

async function initTarCharts(view) {
  const isDark = document.body.classList.contains('dark');
  const gc = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  const tc = isDark ? '#9da0c5' : '#8b8fb5';
  const colors10 = ['#0073ea','#00b875','#9b51e0','#ff7043','#e53935','#ffa000','#8b8fb5','#17a589','#2e86c1','#aaa'];

  // ── TAR DASHBOARD ──────────────────────────────
  if (view === 'tar_dashboard') {
    try {
      const [kpis, weekday, conceptos, subclientes, rechazos] = await Promise.all([
        TAR.dashboardKpis(),
        TAR.activityByWeekday(),
        TAR.byConcepto(),
        TAR.bySubcliente(),
        TAR.rechazosDetail()
      ]);

      if (!kpis || !kpis.total_txns) {
        _tarSetEl('tar-d-txns', '0');
        _tarSetEl('tar-d-monto', '$0');
        _tarSetEl('tar-d-periodo', 'Sin datos — sube un archivo desde Carga de Datos');
        ['c-tar-dias','c-tar-conc-pie','c-tar-top10','c-tar-rechazos'].forEach(id => _tarNoData(id));
        return;
      }

      // KPIs
      _tarSetEl('tar-d-txns', _tarNum(kpis.total_txns));
      _tarSetEl('tar-d-txns-sub', 'Cargos: ' + _tarNum(kpis.txns_cargos) + ' · Abonos: ' + _tarNum(kpis.txns_abonos));
      _tarSetEl('tar-d-monto', _tarFmt(kpis.monto_total));
      _tarSetEl('tar-d-monto-sub', 'Cargos: ' + _tarFmt(kpis.total_cargos) + ' · Abonos: ' + _tarFmt(kpis.total_abonos));
      _tarSetEl('tar-d-cargos', _tarFmt(kpis.total_cargos));
      _tarSetEl('tar-d-cargos-sub', _tarNum(kpis.txns_cargos) + ' transacciones');
      _tarSetEl('tar-d-abonos', _tarFmt(kpis.total_abonos));
      _tarSetEl('tar-d-abonos-sub', _tarNum(kpis.txns_abonos) + ' transacciones');
      _tarSetEl('tar-d-activas', _tarNum(kpis.tarjetas_activas));
      _tarSetEl('tar-d-activas-sub', 'de ' + _tarNum(kpis.tarjetas_total) + ' tarjetas');
      _tarSetEl('tar-d-saldo', _tarFmt(kpis.saldo_total));
      _tarSetEl('tar-d-saldo-sub', _tarNum(kpis.tarjetas_total) + ' tarjetas');
      _tarSetEl('tar-d-rechazo', _tarPct(kpis.tasa_rechazo));
      _tarSetEl('tar-d-rechazo-sub', _tarNum(kpis.rechazadas) + ' rechazadas');
      _tarSetEl('tar-d-ticket', _tarFmt(kpis.ticket_promedio));
      _tarSetEl('tar-d-ticket-sub', 'promedio por txn');
      _tarSetEl('tar-d-periodo', (kpis.fecha_min || '') + ' — ' + (kpis.fecha_max || ''));

      // Días bar chart
      if (weekday && weekday.length) {
        const dLabels = weekday.map(r => r.day_name);
        const dMontos = weekday.map(r => Number(r.monto));
        const dTxns = weekday.map(r => Number(r.txn_count));
        if (TAR_CHARTS.dias) TAR_CHARTS.dias.destroy();
        TAR_CHARTS.dias = new Chart(document.getElementById('c-tar-dias'), {
          data: {
            labels: dLabels,
            datasets: [
              { type:'bar', label:'Monto ($)', data:dMontos, backgroundColor:'#0073ea22', borderColor:'#0073ea', borderWidth:1.5, borderRadius:4, yAxisID:'y' },
              { type:'line', label:'Txns', data:dTxns, borderColor:'#00b875', backgroundColor:'#00b87520', pointRadius:4, pointBackgroundColor:'#00b875', tension:0.3, yAxisID:'y2' }
            ]
          },
          options: { plugins:{legend:{labels:{font:{size:9},color:tc,boxWidth:10}}}, scales:{
            y:{ grid:{color:gc}, ticks:{color:tc,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':v} },
            y2:{ position:'right', grid:{display:false}, ticks:{color:tc,font:{size:9}} },
            x:{ grid:{display:false}, ticks:{color:tc,font:{size:9}} }
          }}
        });
      } else { _tarNoData('c-tar-dias'); }

      // Concepto pie (top 9 + Otros)
      if (conceptos && conceptos.length) {
        const top9 = conceptos.slice(0, 9);
        const rest = conceptos.slice(9);
        const cLabels = top9.map(r => r.concepto);
        const cTxns = top9.map(r => Number(r.txn_count));
        if (rest.length) { cLabels.push('Otros'); cTxns.push(rest.reduce((s, r) => s + Number(r.txn_count), 0)); }
        if (TAR_CHARTS.conc_pie) TAR_CHARTS.conc_pie.destroy();
        TAR_CHARTS.conc_pie = new Chart(document.getElementById('c-tar-conc-pie'), {
          type:'doughnut',
          data:{ labels:cLabels, datasets:[{ data:cTxns, backgroundColor:colors10.slice(0, cLabels.length), borderWidth:0 }] },
          options:{ cutout:'60%', plugins:{ legend:{position:'bottom',labels:{font:{size:8},color:tc,boxWidth:9,padding:6}} } }
        });
      } else { _tarNoData('c-tar-conc-pie'); }

      // Top10 subclientes bar
      if (subclientes && subclientes.length) {
        const top10 = subclientes.slice(0, 10);
        if (TAR_CHARTS.top10) TAR_CHARTS.top10.destroy();
        TAR_CHARTS.top10 = new Chart(document.getElementById('c-tar-top10'), {
          type:'bar',
          data:{ labels:top10.map(r => r.subcliente), datasets:[{ data:top10.map(r => Number(r.monto)), backgroundColor:'#0073ea22', borderColor:'#0073ea', borderWidth:1.5, borderRadius:4 }] },
          options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{
            x:{ grid:{color:gc}, ticks:{color:tc,font:{size:8},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':'$'+v} },
            y:{ grid:{display:false}, ticks:{color:tc,font:{size:8}} }
          }}
        });
      } else { _tarNoData('c-tar-top10'); }

      // Rechazos bar (top 6 + Otras)
      if (rechazos && rechazos.length) {
        const top6 = rechazos.slice(0, 6);
        const rRest = rechazos.slice(6);
        const rLabels = top6.map(r => r.razon);
        const rCounts = top6.map(r => Number(r.txn_count));
        if (rRest.length) { rLabels.push('Otras razones'); rCounts.push(rRest.reduce((s, r) => s + Number(r.txn_count), 0)); }
        if (TAR_CHARTS.rec_dash) TAR_CHARTS.rec_dash.destroy();
        TAR_CHARTS.rec_dash = new Chart(document.getElementById('c-tar-rechazos'), {
          type:'bar',
          data:{ labels:rLabels, datasets:[{ data:rCounts, backgroundColor:'#e5393525', borderColor:'#e53935', borderWidth:1.5, borderRadius:4 }] },
          options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{
            x:{ grid:{color:gc}, ticks:{color:tc,font:{size:8}} },
            y:{ grid:{display:false}, ticks:{color:tc,font:{size:8}} }
          }}
        });
      } else { _tarNoData('c-tar-rechazos'); }

      // Hallazgos dinámicos
      const hDiv = document.getElementById('tar-d-hallazgos');
      if (hDiv && kpis) {
        const items = [];
        if (kpis.tasa_rechazo > 5) items.push('⚠️ Tasa de rechazo elevada: ' + _tarPct(kpis.tasa_rechazo));
        if (rechazos && rechazos.length) items.push('🔴 Principal causa de rechazo: ' + rechazos[0].razon + ' (' + rechazos[0].txn_count + ' txns)');
        if (subclientes && subclientes.length) items.push('🏆 Mayor volumen: ' + subclientes[0].subcliente + ' — ' + _tarFmt(subclientes[0].monto));
        if (conceptos && conceptos.length) items.push('📊 Concepto líder: ' + conceptos[0].concepto + ' (' + _tarFmt(conceptos[0].monto) + ')');
        if (weekday && weekday.length) {
          const topDay = weekday.reduce((a, b) => Number(b.monto) > Number(a.monto) ? b : a, weekday[0]);
          items.push('📅 Día más activo: ' + topDay.day_name + ' (' + _tarFmt(topDay.monto) + ')');
        }
        hDiv.innerHTML = items.length
          ? items.map(i => '<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">' + i + '</div>').join('')
          : '<div style="padding:10px;color:#8b8fb5;font-size:13px">Sin hallazgos disponibles</div>';
      }

    } catch (e) {
      console.error('[TAR] dashboard error:', e);
      _tarSetEl('tar-d-periodo', 'Error al cargar datos');
    }
  }

  // ── TAR CONCEPTOS ──────────────────────────────
  if (view === 'tar_conceptos') {
    try {
      const conceptos = await TAR.byConcepto();
      const kpis = await TAR.dashboardKpis();

      if (!conceptos || !conceptos.length) {
        _tarSetEl('tar-c-periodo', 'Sin datos — sube un archivo desde Carga de Datos');
        ['c-tar-conc-monto','c-tar-conc-txns'].forEach(id => _tarNoData(id));
        return;
      }

      // KPIs
      const topMonto = conceptos[0];
      const topTxns = [...conceptos].sort((a, b) => Number(b.txn_count) - Number(a.txn_count))[0];
      const rechRow = conceptos.find(r => r.concepto === 'RECHAZADA');
      _tarSetEl('tar-c-top-monto', topMonto ? topMonto.concepto : '—');
      _tarSetEl('tar-c-top-monto-sub', topMonto ? _tarFmt(topMonto.monto) + ' (' + _tarPct(topMonto.pct_monto) + ')' : '');
      _tarSetEl('tar-c-top-txns', topTxns ? topTxns.concepto : '—');
      _tarSetEl('tar-c-top-txns-sub', topTxns ? _tarNum(topTxns.txn_count) + ' txns (' + _tarPct(topTxns.pct_txns) + ')' : '');
      _tarSetEl('tar-c-rechazadas', rechRow ? _tarNum(rechRow.txn_count) : '0');
      _tarSetEl('tar-c-rechazadas-sub', rechRow ? _tarFmt(rechRow.monto) + ' (' + _tarPct(rechRow.pct_txns) + ')' : '');
      if (kpis) _tarSetEl('tar-c-periodo', (kpis.fecha_min || '') + ' — ' + (kpis.fecha_max || ''));

      // Donut por monto (top 9 + Otros)
      const top9 = conceptos.slice(0, 9);
      const rest = conceptos.slice(9);
      const mLabels = top9.map(r => r.concepto);
      const mData = top9.map(r => Number(r.monto));
      if (rest.length) { mLabels.push('Otros'); mData.push(rest.reduce((s, r) => s + Number(r.monto), 0)); }
      if (TAR_CHARTS.conc_m) TAR_CHARTS.conc_m.destroy();
      TAR_CHARTS.conc_m = new Chart(document.getElementById('c-tar-conc-monto'), {
        type:'doughnut',
        data:{ labels:mLabels, datasets:[{ data:mData, backgroundColor:colors10.slice(0, mLabels.length), borderWidth:0 }] },
        options:{ cutout:'55%', plugins:{ legend:{position:'right',labels:{font:{size:9},color:tc,boxWidth:10,padding:8}} } }
      });

      // Donut por txns
      const tLabels = top9.map(r => r.concepto);
      const tData = top9.map(r => Number(r.txn_count));
      if (rest.length) { tLabels.push('Otros'); tData.push(rest.reduce((s, r) => s + Number(r.txn_count), 0)); }
      if (TAR_CHARTS.conc_t) TAR_CHARTS.conc_t.destroy();
      TAR_CHARTS.conc_t = new Chart(document.getElementById('c-tar-conc-txns'), {
        type:'doughnut',
        data:{ labels:tLabels, datasets:[{ data:tData, backgroundColor:colors10.slice(0, tLabels.length), borderWidth:0 }] },
        options:{ cutout:'55%', plugins:{ legend:{position:'right',labels:{font:{size:9},color:tc,boxWidth:10,padding:8}} } }
      });

      // Table
      const tbody = document.getElementById('tar-c-tbody');
      if (tbody) {
        tbody.innerHTML = conceptos.map((r, i) =>
          '<tr><td>' + (i + 1) + '</td><td><b>' + (r.concepto || '-') + '</b></td><td style="text-align:right">' +
          _tarNum(r.txn_count) + '</td><td style="text-align:right">' + _tarPct(r.pct_txns) +
          '</td><td style="text-align:right"><b>' + _tarFmt(r.monto) + '</b></td><td style="text-align:right">' +
          _tarPct(r.pct_monto) + '</td><td style="text-align:right">' + _tarFmt(r.ticket_avg) + '</td></tr>'
        ).join('');
      }

    } catch (e) {
      console.error('[TAR] conceptos error:', e);
      _tarSetEl('tar-c-periodo', 'Error al cargar datos');
    }
  }

  // ── TAR SUBCLIENTES ────────────────────────────
  if (view === 'tar_subclientes') {
    try {
      const subs = await TAR.bySubcliente();
      const kpis = await TAR.dashboardKpis();

      if (!subs || !subs.length) {
        _tarSetEl('tar-s-periodo', 'Sin datos — sube un archivo desde Carga de Datos');
        ['c-tar-sub-bar','c-tar-sub-pie'].forEach(id => _tarNoData(id));
        return;
      }

      if (kpis) _tarSetEl('tar-s-periodo', (kpis.fecha_min || '') + ' — ' + (kpis.fecha_max || ''));

      const top10 = subs.slice(0, 10);

      // Bar chart
      if (TAR_CHARTS.sub_bar) TAR_CHARTS.sub_bar.destroy();
      TAR_CHARTS.sub_bar = new Chart(document.getElementById('c-tar-sub-bar'), {
        type:'bar',
        data:{ labels:top10.map(r => r.subcliente), datasets:[{ data:top10.map(r => Number(r.monto)), backgroundColor:colors10, borderWidth:0, borderRadius:5 }] },
        options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{
          x:{ grid:{color:gc}, ticks:{color:tc,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':'$'+v} },
          y:{ grid:{display:false}, ticks:{color:tc,font:{size:9}} }
        }}
      });

      // Pie chart
      if (TAR_CHARTS.sub_pie) TAR_CHARTS.sub_pie.destroy();
      TAR_CHARTS.sub_pie = new Chart(document.getElementById('c-tar-sub-pie'), {
        type:'doughnut',
        data:{ labels:top10.map(r => r.subcliente), datasets:[{ data:top10.map(r => Number(r.monto)), backgroundColor:colors10, borderWidth:0 }] },
        options:{ cutout:'55%', plugins:{ legend:{position:'bottom',labels:{font:{size:8},color:tc,boxWidth:9,padding:5}} } }
      });

      // Table
      const tbody = document.getElementById('tar-s-tbody');
      if (tbody) {
        tbody.innerHTML = subs.map((r, i) =>
          '<tr><td>' + (i + 1) + '</td><td><b>' + (r.subcliente || '-') + '</b></td><td style="text-align:right">' +
          _tarNum(r.txn_count) + '</td><td style="text-align:right"><b>' + _tarFmt(r.monto) +
          '</b></td><td style="text-align:right">' + _tarPct(r.pct) + '</td></tr>'
        ).join('');
      }

    } catch (e) {
      console.error('[TAR] subclientes error:', e);
      _tarSetEl('tar-s-periodo', 'Error al cargar datos');
    }
  }

  // ── TAR RECHAZOS ───────────────────────────────
  if (view === 'tar_rechazos') {
    try {
      const rechazos = await TAR.rechazosDetail();
      const kpis = await TAR.dashboardKpis();

      if (!rechazos || !rechazos.length) {
        _tarSetEl('tar-r-periodo', 'Sin datos — sube un archivo desde Carga de Datos');
        ['c-tar-rec-pie','c-tar-rec-bar'].forEach(id => _tarNoData(id));
        return;
      }

      if (kpis) _tarSetEl('tar-r-periodo', (kpis.fecha_min || '') + ' — ' + (kpis.fecha_max || ''));

      // KPIs
      _tarSetEl('tar-r-causa', rechazos[0].razon);
      _tarSetEl('tar-r-causa-sub', _tarNum(rechazos[0].txn_count) + ' txns (' + _tarPct(rechazos[0].pct) + ')');
      const totalRecMonto = rechazos.reduce((s, r) => s + Number(r.monto), 0);
      _tarSetEl('tar-r-monto', _tarFmt(totalRecMonto));
      _tarSetEl('tar-r-monto-sub', _tarNum(rechazos.reduce((s, r) => s + Number(r.txn_count), 0)) + ' rechazos totales');
      _tarSetEl('tar-r-razones', String(rechazos.length));
      _tarSetEl('tar-r-razones-sub', 'tipos distintos');

      const recColors = ['#e53935','#ff7043','#ffa000','#ffcc02','#aaa','#ccc','#ddd'];
      const top6 = rechazos.slice(0, 6);
      const rRest = rechazos.slice(6);
      const rLabels = top6.map(r => r.razon);
      const rTxns = top6.map(r => Number(r.txn_count));
      const rMontos = top6.map(r => Number(r.monto));
      if (rRest.length) {
        rLabels.push('Otras razones');
        rTxns.push(rRest.reduce((s, r) => s + Number(r.txn_count), 0));
        rMontos.push(rRest.reduce((s, r) => s + Number(r.monto), 0));
      }

      // Pie chart
      if (TAR_CHARTS.rec_pie) TAR_CHARTS.rec_pie.destroy();
      TAR_CHARTS.rec_pie = new Chart(document.getElementById('c-tar-rec-pie'), {
        type:'doughnut',
        data:{ labels:rLabels, datasets:[{ data:rTxns, backgroundColor:recColors.slice(0, rLabels.length), borderWidth:0 }] },
        options:{ cutout:'55%', plugins:{ legend:{position:'right',labels:{font:{size:9},color:tc,boxWidth:10,padding:8}} } }
      });

      // Bar chart
      if (TAR_CHARTS.rec_bar) TAR_CHARTS.rec_bar.destroy();
      TAR_CHARTS.rec_bar = new Chart(document.getElementById('c-tar-rec-bar'), {
        type:'bar',
        data:{ labels:rLabels, datasets:[{ data:rMontos, backgroundColor:'#e5393520', borderColor:'#e53935', borderWidth:1.5, borderRadius:4 }] },
        options:{ indexAxis:'y', plugins:{legend:{display:false}}, scales:{
          x:{ grid:{color:gc}, ticks:{color:tc,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':'$'+v} },
          y:{ grid:{display:false}, ticks:{color:tc,font:{size:9}} }
        }}
      });

      // Table
      const tbody = document.getElementById('tar-r-tbody');
      if (tbody) {
        tbody.innerHTML = rechazos.map((r, i) =>
          '<tr><td>' + (i + 1) + '</td><td><b>' + (r.razon || '-') + '</b></td><td style="text-align:right">' +
          _tarNum(r.txn_count) + '</td><td style="text-align:right"><b>' + _tarFmt(r.monto) +
          '</b></td><td style="text-align:right">' + _tarPct(r.pct) + '</td></tr>'
        ).join('');
      }

    } catch (e) {
      console.error('[TAR] rechazos error:', e);
      _tarSetEl('tar-r-periodo', 'Error al cargar datos');
    }
  }

  // ── TAR TARJETAHABIENTES ───────────────────────
  if (view === 'tar_tarjetahabientes') {
    try {
      const summary = await TAR.cardholdersSummary();
      const kpis = await TAR.dashboardKpis();

      if (!summary || !summary.totals) {
        _tarSetEl('tar-t-periodo', 'Sin datos — sube un archivo desde Carga de Datos');
        _tarNoData('c-tar-saldos');
        return;
      }

      if (kpis) _tarSetEl('tar-t-periodo', (kpis.fecha_min || '') + ' — ' + (kpis.fecha_max || ''));
      const t = summary.totals;
      _tarSetEl('tar-t-activas', _tarNum(t.activas));
      _tarSetEl('tar-t-activas-sub', _tarPct(t.total > 0 ? (t.activas / t.total * 100) : 0) + ' del total');
      _tarSetEl('tar-t-bloqueadas', _tarNum(t.bloqueadas));
      _tarSetEl('tar-t-bloqueadas-sub', _tarPct(t.total > 0 ? (t.bloqueadas / t.total * 100) : 0) + ' del total');
      _tarSetEl('tar-t-inactivas', _tarNum(t.inactivas));
      _tarSetEl('tar-t-inactivas-sub', _tarPct(t.total > 0 ? (t.inactivas / t.total * 100) : 0) + ' del total');

      // Saldos chart
      const sr = summary.saldo_ranges;
      if (sr && sr.length) {
        const sColors = ['#e53935','#8b8fb5','#0073ea','#9b51e0','#00b875','#ffa000'];
        if (TAR_CHARTS.saldos) TAR_CHARTS.saldos.destroy();
        TAR_CHARTS.saldos = new Chart(document.getElementById('c-tar-saldos'), {
          type:'bar',
          data:{ labels:sr.map(r => r.range_label), datasets:[{ data:sr.map(r => Number(r.saldo_total)), backgroundColor:sColors.slice(0, sr.length).map(c => c + '20'), borderColor:sColors.slice(0, sr.length), borderWidth:1.5, borderRadius:4 }] },
          options:{ plugins:{legend:{display:false}}, scales:{
            x:{ grid:{display:false}, ticks:{color:tc,font:{size:8}} },
            y:{ grid:{color:gc}, ticks:{color:tc,font:{size:9},callback:v=>v>=1e6?'$'+(v/1e6).toFixed(1)+'M':v>=1e3?'$'+(v/1e3).toFixed(0)+'K':'$'+v} }
          }}
        });
      } else { _tarNoData('c-tar-saldos'); }

      // Saldos ranges table
      const sTbody = document.getElementById('tar-t-saldos-tbody');
      if (sTbody && sr && sr.length) {
        sTbody.innerHTML = sr.map(r =>
          '<tr><td>' + r.range_label + '</td><td style="text-align:right">' + _tarNum(r.count) +
          '</td><td style="text-align:right"><b>' + _tarFmt(r.saldo_total) + '</b></td></tr>'
        ).join('');
      }

      // Top clientes table
      const cTbody = document.getElementById('tar-t-clientes-tbody');
      if (cTbody && summary.top_clientes && summary.top_clientes.length) {
        cTbody.innerHTML = summary.top_clientes.map((r, i) =>
          '<tr><td>' + (i + 1) + '</td><td><b>' + (r.cliente || '-') + '</b></td><td style="text-align:right">' +
          _tarNum(r.tarjetas) + '</td><td style="text-align:right"><b>' + _tarFmt(r.saldo_total) + '</b></td></tr>'
        ).join('');
      }

    } catch (e) {
      console.error('[TAR] tarjetahabientes error:', e);
      _tarSetEl('tar-t-periodo', 'Error al cargar datos');
    }
  }
}



// ==============================
// CATEGORÍAS P&L — GESTOR
// ==============================
const CAT_CD_DEFAULT = [
  {id:'cd1', nombre:'Nómina Operativa',      tipo:'Nómina',          empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'cd2', nombre:'Software',              tipo:'Operaciones',     empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'cd3', nombre:'Hardware',              tipo:'Operaciones',     empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'cd4', nombre:'Liquidity Providers',   tipo:'Costos Directos', empresas:['Wirebit'], ppto:0},
  {id:'cd5', nombre:'Comisiones Promotoría', tipo:'Com. Bancarias',  empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
];
const CAT_GA_DEFAULT = [
  {id:'ga1', nombre:'Nómina Administrativa', tipo:'Nómina', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga2', nombre:'Renta Oficina', tipo:'Renta', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga3', nombre:'Mantenimiento', tipo:'Renta', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga4', nombre:'Renta Impresora', tipo:'Administrativo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga5', nombre:'Software', tipo:'Operaciones', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga6', nombre:'Hardware', tipo:'Operaciones', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga7', nombre:'Efevoo Tarjetas', tipo:'Costo Directo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga8', nombre:'Efevoo TPV', tipo:'Costo Directo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga9', nombre:'Marketing', tipo:'Marketing', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga10', nombre:'Luz', tipo:'Administrativo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga11', nombre:'Insumos Oficina', tipo:'Administrativo', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga12', nombre:'Viáticos', tipo:'Representación', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga13', nombre:'Comisiones Bancarias', tipo:'Com. Bancarias', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
  {id:'ga14', nombre:'Cumplimiento', tipo:'Regulatorio', empresas:['Salem','Endless','Dynamo','Wirebit'], ppto:0},
];

function catGetData(sec){
  const key = sec==='cd' ? 'gf_cat_cd' : 'gf_cat_ga';
  const def = sec==='cd' ? CAT_CD_DEFAULT : CAT_GA_DEFAULT;
  try { const s=DB.get(key); return (s&&s.length)?s:JSON.parse(JSON.stringify(def)); }
  catch(e){ return JSON.parse(JSON.stringify(def)); }
}
function catSetData(sec,data){
  DB.set(sec==='cd'?'gf_cat_cd':'gf_cat_ga', data);
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
        +'<td style="font-weight:600">'+escapeHtml(c.nombre)+'</td>'
        +'<td><span style="font-size:.65rem;color:var(--muted);background:var(--bg);padding:2px 7px;border-radius:10px">'+c.tipo+'</span></td>'
        +'<td><div style="display:flex;gap:3px;flex-wrap:wrap">'+boxes+'</div></td>'
        +'<td style="text-align:right">'+pp+'</td>'
        +'<td style="text-align:center;white-space:nowrap">'
          +(!isViewer() ? '<button onclick="catEdit('+i+',\''+sec+'\')" style="background:var(--blue-bg);color:#0073ea;border:none;border-radius:5px;padding:3px 9px;font-size:.65rem;cursor:pointer;margin-right:4px">✏️</button>'
          +'<button onclick="catDel('+i+',\''+sec+'\')" style="background:#fde8e8;color:#c62828;border:none;border-radius:5px;padding:3px 9px;font-size:.65rem;cursor:pointer">🗑</button>' : '')
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
        +'<input type="text" id="cm-nombre" class="fi" value="'+escapeHtml(item.nombre)+'" placeholder="Ej: Comisiones Promotoría"></div>'
      +'<div style="margin-bottom:12px"><label class="fl">Tipo / Agrupación</label>'
        +'<input type="text" id="cm-tipo" class="fi" value="'+escapeHtml(item.tipo)+'" placeholder="Ej: Nómina, Operaciones..."></div>'
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
// ═══  CONFIGURACIÓN DE COMISIONES  ═══
// ══════════════════════════════════════

let _comClientesCache = [];
let _comAgentesCache = [];
let _editingClientId = null;

const _RATE_FIELDS = [
  'rate_efevoo_tc','rate_efevoo_td','rate_efevoo_amex','rate_efevoo_ti',
  'rate_salem_tc','rate_salem_td','rate_salem_amex','rate_salem_ti',
  'rate_convenia_tc','rate_convenia_td','rate_convenia_amex','rate_convenia_ti',
  'rate_comisionista_tc','rate_comisionista_td','rate_comisionista_amex','rate_comisionista_ti'
];

const _MSI_PLAZOS = [3, 6, 9, 12, 18];
const _MSI_ENTITIES = ['efevoo','salem','convenia','comisionista'];
const _MSI_CARDS = ['TC','Amex'];

function _fmtRate(v) {
  const n = parseFloat(v) || 0;
  if (n === 0) return '<span style="color:var(--muted)">—</span>';
  return (n * 100).toFixed(4) + '%';
}

async function rTPVComisiones() {
  try {
    const [clients, agentes] = await Promise.all([TPV.getClients(), TPV.getAgentes()]);
    _comClientesCache = clients || [];
    _comAgentesCache = agentes || [];

    // KPIs
    const total = _comClientesCache.length;
    const conAgente = _comClientesCache.filter(c => c.agente_id).length;
    const conPromotor = _comClientesCache.filter(c => c.promotor && c.promotor !== 'Sin Promotor').length;
    const sinConfig = _comClientesCache.filter(c => {
      const hasRate = _RATE_FIELDS.some(f => parseFloat(c[f]) > 0);
      return !hasRate;
    }).length;

    const kT = document.getElementById('com-kpi-total');
    const kA = document.getElementById('com-kpi-agente');
    const kP = document.getElementById('com-kpi-promotor');
    const kS = document.getElementById('com-kpi-sinconfig');
    if (kT) { kT.textContent = total; document.getElementById('com-kpi-total-sub').textContent = 'En base de datos'; }
    if (kA) { kA.textContent = conAgente; document.getElementById('com-kpi-agente-sub').textContent = `${total - conAgente} sin agente`; }
    if (kP) { kP.textContent = conPromotor; document.getElementById('com-kpi-promotor-sub').textContent = `${total - conPromotor} sin promotor`; }
    if (kS) { kS.textContent = sinConfig; document.getElementById('com-kpi-sinconfig-sub').textContent = sinConfig > 0 ? 'Requieren configuración' : 'Todos configurados'; }

    // Agente filter dropdown
    const sel = document.getElementById('com-cfg-agente-filter');
    if (sel) {
      sel.innerHTML = '<option value="">Todos los agentes</option>';
      _comAgentesCache.forEach(a => {
        sel.innerHTML += `<option value="${a.id}">${escapeHtml(a.nombre)} (${escapeHtml(a.siglas || '')})</option>`;
      });
    }

    // Render table
    _renderComTable(_comClientesCache);

    // Clear search
    const s = document.getElementById('com-cfg-search');
    if (s) s.value = '';

  } catch (e) {
    console.error('[COM] rTPVComisiones error:', e);
    toast('Error cargando clientes: ' + e.message);
  }
}

// Get the best rate for a card type across all entities
function _getCardRate(c, cardType) {
  const entities = ['efevoo','salem','convenia','comisionista'];
  for (const ent of entities) {
    const v = parseFloat(c['rate_' + ent + '_' + cardType]);
    if (v > 0) return v;
  }
  return 0;
}

// Detect which entity has rates for a client
function _getClientEntity(c) {
  const entities = ['efevoo','salem','convenia','comisionista'];
  const labels = { efevoo:'Efevoo', salem:'Salem', convenia:'Convenia', comisionista:'Comisionista' };
  const colors = { efevoo:'#0073ea', salem:'var(--green)', convenia:'var(--purple)', comisionista:'var(--orange)' };
  for (const ent of entities) {
    if (['tc','td','amex','ti'].some(ct => parseFloat(c['rate_' + ent + '_' + ct]) > 0)) {
      return { name: labels[ent], color: colors[ent] };
    }
  }
  return c.entidad ? { name: c.entidad, color: 'var(--muted)' } : null;
}

function _renderComTable(clients) {
  const tbody = document.getElementById('com-cfg-tbody');
  if (!tbody) return;

  if (!clients.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px">No hay clientes registrados</td></tr>';
    const ct = document.getElementById('com-cfg-count');
    if (ct) ct.textContent = '0 clientes';
    return;
  }

  tbody.innerHTML = clients.map((c, i) => {
    const agSig = c.tpv_agentes ? c.tpv_agentes.siglas || c.tpv_agentes.nombre : '';
    const origIdx = _comClientesCache.indexOf(c);
    const ent = _getClientEntity(c);
    const entPill = ent ? `<span class="pill" style="font-size:.58rem;background:${ent.color}20;color:${ent.color};border:1px solid ${ent.color}40">${escapeHtml(ent.name)}</span>` : '<span style="color:var(--muted)">—</span>';
    return `<tr data-com-idx="${i}" data-com-nombre="${(c.nombre||'').toLowerCase()}" data-com-agente="${c.agente_id||''}">
      <td style="font-weight:600;font-size:.72rem;white-space:nowrap;cursor:pointer;color:var(--blue)" onclick="openComDetail(_comClientesCache[${origIdx}])">${escapeHtml(c.nombre_display || c.nombre || '—')}</td>
      <td style="font-size:.72rem">${agSig ? `<span class="pill" style="font-size:.62rem">${escapeHtml(agSig)}</span>` : '<span style="color:var(--muted)">—</span>'}</td>
      <td style="font-size:.72rem">${entPill}</td>
      <td class="r" style="font-size:.72rem">${_fmtRate(_getCardRate(c, 'tc'))}</td>
      <td class="r" style="font-size:.72rem">${_fmtRate(_getCardRate(c, 'td'))}</td>
      <td class="r" style="font-size:.72rem">${_fmtRate(_getCardRate(c, 'amex'))}</td>
      <td class="r" style="font-size:.72rem">${_fmtRate(_getCardRate(c, 'ti'))}</td>
      <td class="r" style="font-size:.72rem">${c.factor_iva || 1.16}</td>
      <td style="text-align:center">${!isViewer() ? `<button onclick="openComEdit(_comClientesCache[${origIdx}])" style="background:none;border:none;cursor:pointer;font-size:.85rem" title="Editar">✏️</button>` : ''}</td>
    </tr>`;
  }).join('');

  const ct = document.getElementById('com-cfg-count');
  if (ct) ct.textContent = `${clients.length} cliente${clients.length !== 1 ? 's' : ''}`;
}

function filterComClientes() {
  const q = (document.getElementById('com-cfg-search')?.value || '').toLowerCase().trim();
  const agId = document.getElementById('com-cfg-agente-filter')?.value || '';
  const tbody = document.getElementById('com-cfg-tbody');
  if (!tbody) return;

  let visible = 0;
  tbody.querySelectorAll('tr[data-com-idx]').forEach(tr => {
    const nombre = tr.getAttribute('data-com-nombre') || '';
    const agente = tr.getAttribute('data-com-agente') || '';
    const matchQ = !q || nombre.includes(q);
    const matchA = !agId || agente === agId;
    const show = matchQ && matchA;
    tr.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  const ct = document.getElementById('com-cfg-count');
  if (ct) ct.textContent = `${visible} de ${_comClientesCache.length} clientes`;
}

async function openComDetail(client) {
  if (!client) return;
  const ov = document.getElementById('com-detail-overlay');
  if (!ov) return;
  ov.style.display = 'flex';

  // Header
  const nm = document.getElementById('com-detail-name');
  if (nm) nm.textContent = client.nombre_display || client.nombre || '—';
  const sub = document.getElementById('com-detail-sub');
  const ent = _getClientEntity(client);
  if (sub) sub.textContent = ent ? ent.name + ' · ' + (client.promotor || 'Sin Promotor') : client.promotor || 'Sin Promotor';

  // Edit button
  const editBtn = document.getElementById('com-detail-edit-btn');
  if (editBtn) editBtn.onclick = () => { ov.style.display = 'none'; openComEdit(client); };

  // Info cards
  const info = document.getElementById('com-detail-info');
  if (info) {
    const agSig = client.tpv_agentes ? client.tpv_agentes.nombre + ' (' + (client.tpv_agentes.siglas||'') + ')' : 'Sin agente';
    info.innerHTML = `
      <div style="background:var(--bg);border-radius:8px;padding:10px">
        <div style="font-size:.6rem;color:var(--muted);margin-bottom:2px">Agente</div>
        <div style="font-size:.78rem;font-weight:600">${escapeHtml(agSig)}</div>
      </div>
      <div style="background:var(--bg);border-radius:8px;padding:10px">
        <div style="font-size:.6rem;color:var(--muted);margin-bottom:2px">Promotor</div>
        <div style="font-size:.78rem;font-weight:600">${escapeHtml(client.promotor || 'Sin Promotor')}</div>
      </div>
      <div style="background:var(--bg);border-radius:8px;padding:10px">
        <div style="font-size:.6rem;color:var(--muted);margin-bottom:2px">Factor IVA</div>
        <div style="font-size:.78rem;font-weight:600">${client.factor_iva || 1.16}</div>
      </div>`;
  }

  // Rates table
  const ratesEl = document.getElementById('com-detail-rates');
  if (ratesEl) {
    const entities = ['efevoo','salem','convenia','comisionista'];
    const labels = { efevoo:'Efevoo', salem:'Salem', convenia:'Convenia', comisionista:'Comisionista' };
    const cards = ['tc','td','amex','ti'];
    const cardLabels = { tc:'Crédito (TC)', td:'Débito (TD)', amex:'Amex', ti:'Internacional (TI)' };
    // Find which entities have data
    const activeEnts = entities.filter(ent => cards.some(ct => parseFloat(client['rate_' + ent + '_' + ct]) > 0));
    if (activeEnts.length === 0) {
      ratesEl.innerHTML = '<div style="color:var(--muted);font-size:.72rem;padding:10px">Sin comisiones configuradas</div>';
    } else {
      let html = '<table class="bt" style="font-size:.72rem;width:100%"><thead><tr><th>Tarjeta</th>';
      activeEnts.forEach(e => html += `<th class="r">${labels[e]}</th>`);
      html += '</tr></thead><tbody>';
      cards.forEach(ct => {
        const hasAny = activeEnts.some(e => parseFloat(client['rate_' + e + '_' + ct]) > 0);
        if (hasAny) {
          html += `<tr><td style="font-weight:600">${cardLabels[ct]}</td>`;
          activeEnts.forEach(e => html += `<td class="r">${_fmtRate(client['rate_' + e + '_' + ct])}</td>`);
          html += '</tr>';
        }
      });
      html += '</tbody></table>';
      ratesEl.innerHTML = html;
    }
  }

  // MSI rates
  const msiEl = document.getElementById('com-detail-msi');
  if (msiEl && client.id) {
    try {
      const msiData = await TPV.getClientMsiRates(client.id);
      if (!msiData || msiData.length === 0) {
        msiEl.innerHTML = '<div style="color:var(--muted);font-size:.72rem;padding:10px">Sin configuración MSI</div>';
      } else {
        const entitiesInMsi = [...new Set(msiData.map(r => r.entity))];
        const entLabels = { efevoo:'Efevoo', salem:'Salem', convenia:'Convenia', comisionista:'Comisionista' };
        let html = '<table class="bt" style="font-size:.72rem;width:100%"><thead><tr><th>Plazo</th><th>Tarjeta</th>';
        entitiesInMsi.forEach(e => html += `<th class="r">${entLabels[e] || e}</th>`);
        html += '</tr></thead><tbody>';
        _MSI_PLAZOS.forEach(plazo => {
          _MSI_CARDS.forEach((card, ci) => {
            const hasAny = entitiesInMsi.some(e => msiData.find(r => r.plazo === plazo && r.entity === e && r.card_type === card && r.rate > 0));
            if (hasAny) {
              html += `<tr>`;
              if (ci === 0) html += `<td rowspan="${_MSI_CARDS.filter((_,j) => entitiesInMsi.some(e => msiData.find(r => r.plazo === plazo && r.entity === e && r.card_type === _MSI_CARDS[j] && r.rate > 0))).length}" style="font-weight:600">${plazo} meses</td>`;
              html += `<td>${card}</td>`;
              entitiesInMsi.forEach(e => {
                const found = msiData.find(r => r.plazo === plazo && r.entity === e && r.card_type === card);
                html += `<td class="r">${found && found.rate > 0 ? (found.rate * 100).toFixed(4) + '%' : '<span style="color:var(--muted)">—</span>'}</td>`;
              });
              html += '</tr>';
            }
          });
        });
        html += '</tbody></table>';
        msiEl.innerHTML = html;
      }
    } catch (e) {
      msiEl.innerHTML = '<div style="color:var(--muted);font-size:.72rem;padding:10px">Error cargando MSI</div>';
    }
  } else if (msiEl) {
    msiEl.innerHTML = '<div style="color:var(--muted);font-size:.72rem;padding:10px">Sin configuración MSI</div>';
  }
}

async function openComEdit(client) {
  _editingClientId = client?.id || null;

  // Title
  const title = document.getElementById('com-edit-title');
  const sub = document.getElementById('com-edit-sub');
  if (title) title.textContent = client ? `Editar: ${client.nombre_display || client.nombre}` : 'Nuevo Cliente';
  if (sub) sub.textContent = client ? `ID: ${client.id} · Última actualización: ${client.updated_at ? new Date(client.updated_at).toLocaleDateString('es-MX') : '—'}` : 'Configura datos y tasas de comisión';

  // Agent dropdown
  const agSel = document.getElementById('com-edit-agente');
  if (agSel) {
    agSel.innerHTML = '<option value="">Sin agente</option>';
    _comAgentesCache.forEach(a => {
      agSel.innerHTML += `<option value="${a.id}">${escapeHtml(a.nombre)} (${escapeHtml(a.siglas || '')})</option>`;
    });
    agSel.value = client?.agente_id || '';
  }

  // Fill basic fields
  const _n = document.getElementById('com-edit-nombre');   if (_n) _n.value = client?.nombre || '';
  const _p = document.getElementById('com-edit-promotor'); if (_p) _p.value = client?.promotor || '';
  const _iv = document.getElementById('com-edit-iva');     if (_iv) _iv.value = client?.factor_iva ?? 1.16;
  const _d = document.getElementById('com-edit-display');  if (_d) _d.value = client?.nombre_display || '';

  // Fill rate fields
  _RATE_FIELDS.forEach(f => {
    const el = document.getElementById('com-edit-' + f);
    if (el) el.value = client ? (parseFloat(client[f]) || 0) : 0;
  });

  // Fill MSI rates
  const msiTbody = document.getElementById('com-edit-msi-tbody');
  if (msiTbody) {
    let msiData = [];
    if (client?.id) {
      try { msiData = await TPV.getClientMsiRates(client.id); } catch (e) { console.warn('MSI load error:', e); }
    }

    let msiHtml = '';
    _MSI_PLAZOS.forEach(plazo => {
      _MSI_CARDS.forEach((card, ci) => {
        msiHtml += `<tr${ci === 0 ? ' style="border-top:2px solid var(--border)"' : ''}>`;
        msiHtml += ci === 0 ? `<td rowspan="${_MSI_CARDS.length}" style="font-weight:600;font-size:.72rem;vertical-align:middle">${plazo} MSI</td>` : '';
        msiHtml += `<td style="font-size:.72rem">${card}</td>`;
        _MSI_ENTITIES.forEach(ent => {
          const existing = msiData.find(r => r.plazo === plazo && r.entity === ent && r.card_type === card);
          const val = existing ? existing.rate : 0;
          msiHtml += `<td><input data-msi-plazo="${plazo}" data-msi-entity="${ent}" data-msi-card="${card}" type="number" step="0.00000001" min="0" max="1" value="${val}" style="width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:.72rem;text-align:right;background:var(--bg);color:var(--text);box-sizing:border-box"></td>`;
        });
        msiHtml += '</tr>';
      });
    });
    msiTbody.innerHTML = msiHtml;
  }

  // Collapse MSI section
  const msiSection = document.getElementById('com-msi-section');
  if (msiSection) msiSection.style.display = 'none';

  // Show overlay
  const ov = document.getElementById('com-edit-overlay');
  if (ov) ov.style.display = 'flex';
}

function closeComEdit() {
  const ov = document.getElementById('com-edit-overlay');
  if (ov) ov.style.display = 'none';
  _editingClientId = null;
}

// ── RATE CHANGES HISTORY MODAL ──
function openRateChanges() {
  const ov = document.getElementById('rate-changes-overlay');
  if (!ov) return;
  ov.style.display = 'flex';

  const changes = TPV.getRateChanges();
  const tbody = document.getElementById('rate-changes-tbody');
  const info = document.getElementById('rate-changes-info');
  const sub = document.getElementById('rate-changes-subtitle');

  if (!changes.length) {
    if (sub) sub.textContent = 'No hay cambios de tasas registrados';
    if (info) info.innerHTML = '<div style="padding:12px;background:var(--blue-bg);border-radius:8px;font-size:.72rem;color:var(--blue)">ℹ️ Para registrar cambios de tasas, usa la hoja <b>Cambios_Comisiones</b> en la plantilla de configuración Excel y súbela desde la sección de Carga de Datos.</div>';
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--muted);font-size:.8rem">Sin cambios de tasas registrados</td></tr>';
    return;
  }

  // Count unique clients
  const uniqueClients = new Set(changes.map(c => c.cliente)).size;
  if (sub) sub.textContent = `${changes.length} cambios registrados · ${uniqueClients} clientes afectados`;

  if (info) info.innerHTML = '<div style="padding:10px 12px;background:var(--purple-bg);border-radius:8px;font-size:.72rem;color:var(--purple);margin-bottom:4px">📊 Las comisiones se corrigen automáticamente: para transacciones anteriores al cambio se usa la tasa anterior, para las posteriores la tasa nueva.</div>';

  // Sort: most recent first (descending by fecha_cambio)
  const sorted = [...changes].sort((a, b) =>
    a.fecha_cambio < b.fecha_cambio ? 1 : a.fecha_cambio > b.fecha_cambio ? -1 : 0
  );

  if (tbody) {
    tbody.innerHTML = sorted.map(ch => {
      const delta = ch.tasa_nueva - ch.tasa_anterior;
      const deltaColor = delta > 0 ? 'var(--red)' : delta < 0 ? 'var(--green)' : 'var(--muted)';
      const deltaSign = delta > 0 ? '+' : '';
      return `<tr>
        <td class="bld" style="font-size:.73rem">${ch.cliente}</td>
        <td style="font-size:.72rem"><span style="background:var(--blue-bg);color:var(--blue);padding:1px 6px;border-radius:4px;font-weight:600">${ch.campo}</span></td>
        <td style="font-size:.73rem">${ch.fecha_cambio || '—'}</td>
        <td class="mo" style="text-align:right;font-size:.73rem">${(ch.tasa_anterior * 100).toFixed(4)}%</td>
        <td class="mo" style="text-align:right;font-size:.73rem;font-weight:700">${(ch.tasa_nueva * 100).toFixed(4)}%</td>
        <td class="mo" style="text-align:right;font-size:.73rem;color:${deltaColor};font-weight:700">${deltaSign}${(delta * 100).toFixed(4)}%</td>
        <td style="font-size:.7rem;color:var(--muted);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ch.notas || '—'}</td>
      </tr>`;
    }).join('');
  }
}

function closeRateChanges() {
  const ov = document.getElementById('rate-changes-overlay');
  if (ov) ov.style.display = 'none';
}

async function saveComEdit() {
  const nombre = document.getElementById('com-edit-nombre').value.trim();
  if (!nombre) { toast('⚠️ El nombre del cliente es obligatorio'); return; }

  const client = { nombre };

  // Basic fields
  const display = document.getElementById('com-edit-display').value.trim();
  if (display) client.nombre_display = display;
  const agenteId = document.getElementById('com-edit-agente').value;
  client.agente_id = agenteId ? parseInt(agenteId) : null;
  client.promotor = document.getElementById('com-edit-promotor').value.trim() || 'Sin Promotor';
  client.factor_iva = parseFloat(document.getElementById('com-edit-iva').value) || 1.16;

  // Rate fields
  _RATE_FIELDS.forEach(f => {
    const el = document.getElementById('com-edit-' + f);
    client[f] = el ? parseFloat(el.value) || 0 : 0;
  });

  // If editing existing, pass id
  if (_editingClientId) client.id = _editingClientId;

  try {
    const result = await TPV.saveClient(client);
    const savedId = result?.[0]?.id || _editingClientId;

    // Save MSI rates
    if (savedId) {
      const msiInputs = document.querySelectorAll('#com-edit-msi-tbody input[data-msi-plazo]');
      if (msiInputs.length > 0) {
        const rates = [];
        msiInputs.forEach(inp => {
          const rate = parseFloat(inp.value) || 0;
          if (rate > 0) {
            rates.push({
              plazo: parseInt(inp.dataset.msiPlazo),
              entity: inp.dataset.msiEntity,
              card_type: inp.dataset.msiCard,
              rate
            });
          }
        });
        if (rates.length > 0) {
          await TPV.saveClientMsiRates(savedId, rates);
        }
      }
    }

    toast('✅ Cliente guardado correctamente');
    closeComEdit();
    rTPVComisiones();
  } catch (e) {
    console.error('[COM] saveComEdit error:', e);
    toast('❌ Error al guardar: ' + e.message);
  }
}

// ══════════════════════════════════════
