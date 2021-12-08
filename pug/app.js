const express = require("express")
const Lib = require('./lib')
const { Router } = express;
const router = Router();
const multer = require('multer')
const bodyParser = require('body-parser')
let visitCounter = 0
let requestCounter = 0
const app = express();
let lib = new Lib()

//middlewares
app.use(express.json())
app.use(express.urlencoded({
    extended: false
}))
app.use('/files', express.static('uploads'))

//configuración storage del multer.
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
})

//multer para subir archivos
const upload = multer({ storage })

// SET TEMPLATE ENGINE
app.set('views', './views')
app.set('view engine', 'pug')

//imprimo fecha hora en cada visita y genero contador.
app.use(function(req, res, next) {
    console.log("Time: ", Date.now())
    visitCounter++
    next()
    })

//por cada request, creo arc-hivo y guardo contador.
router.use(function (req, res, next) {
    lib.createFile()
    requestCounter++
    next()
})
router.use(express.urlencoded({
    extended: true
  }))
router.use(bodyParser.json());

app.get('/', (req, res) => {

    res.render('main.pug')
})

app.get('/list', (req, res) => {
    let listaProductos = lib.getAllObjects()
    res.render('list.pug',{list: listaProductos})
})

router.get('/:id', (req, res) => {
    try {
        console.log("GET por ID")
        let productos = lib.getAllObjects()
        let id = req.params.id;
        console.log("Id a buscar: "+ id)
        let producto = productos.find(c => c.id == id)
        if (producto == undefined) {
            throw new Error(`Producto ${id} no encontrado`)

        } else {
            console.log(`El producto con ${id} es: ${producto}`)
            res.json(producto)
        }
    } catch (error) {  
        res.status(404).send({
            error: {
            status: 404,
            message: error.message
            }
        })  
    }
})

router.post("/", upload.single('thumbail'), (req, res) => {
    console.log("Inicio Guardado de Producto: "+ JSON.stringify(req.body));
    let obj = req.body
    const file = req.file
    console.log("Nombre Archivo: "+ file)
    obj.thumbail = "/files/" + file.filename;
    console.log("Producto guardado" + obj.thumbail)

    lib.saveObjects(obj)
    console.log("Producto guardado" + JSON.stringify(obj))

    return res.redirect("/list")
})

router.put('/:id', (req, res) => {
    try{
        console.log("------new put request-------")
        let productos = lib.getAllObjects()
        let id = req.params.id;
        console.log("-------------------------")
        console.log("Id a buscar: "+ id)
        let productIndex = productos.findIndex(c => c.id == id)
        console.log("-------------------------")
        console.log("Index a buscar: "+ productIndex)
        if (productIndex<0) {
            throw new Error(`No se encontro el producto con ${id}`) 
        }
    else {
        console.log(`El producto con id ${id} es: ${productos[productIndex]}`)
        console.log("-------------------------")
        console.log(JSON.stringify(productos[productIndex]))
        lib.updateObjectById(req.body, id)
        console.log("-------------------------")
        console.log(JSON.stringify(productos[productIndex]))
        res.json({
            resultCode: '200',
            message: 'Producto actualizado',
            nuevo: req.body
        })}
    } catch (error) {
        res.status(404).send({
            error: {
            status: 404,
            message: error.message
            }
        })
    }
    })




router.delete('/:id', (req, res) => {
    try {
        //delete from object listaProductos
        let listaProductos = lib.getAllObjects()
        let id = req.params.id;
        console.log("Id a borrar: "+ id)
        let producto = listaProductos.find(c => c.id == id)
        if (producto == undefined) {
            res.status(400).send(
                {
                    error: "400",
                    errorMessage: `Producto id: ${id} no encontrado`
                }
            )
        }
        else {
            console.log(`El producto con ${id} es: ${producto}`)
            lib.deleteObjectById(id)
            res.send({
                resultCode: '200',
                title: producto.title,
                id: producto.id,
                message: 'Producto borrado'
            })
    }
    } catch (error) {
        res.status(404).send({
            error: {
            status: 404,
            message: error.message
            }
})
    }
})




app.use('/api/productos', router)

app.listen(process.env.PORT || 3000)
app.use(function(err, req, res, next) {
    //res.status(400).send("Pagina no disponible en este momento. Por favor, intente más tarde.")
    res.status(err.status || 404).send({
        err: {
        status: err.status || 404,
        message: err.message || "Pagina no encontrada."
        }
    })  
})