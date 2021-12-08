const { json } = require("express");
const express = require("express")
const handlebars = require("express-handlebars")
const app = express()
const router = express.Router();
const multer = require('multer')
let Container = new require('./container.js')
let visitCounter = 0
let requestCounter = 0

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

app.post('/upload', upload.single('myFile'), (req, res) => {
    const file = req.file
    console.log(req.body)
    if(!file) {
        const error = new Error("Please upload file :(")
        error.httpStatusCode = 400;
        return next(error)
    }
    res.send(file)
})

//seteamos motor plantilla: HBS
app.engine(
    "hbs",
    handlebars.engine({
        extname: ".hbs",
        defaultLayout: 'main.hbs',
        layoutsDir: __dirname + "/views/layouts",
        partialsDir: __dirname + "/views/partials"
    })
)

app.set('view engine', 'hbs');
app.set("views", "./views");

//middlewares
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))
app.use('/files', express.static('uploads'))

//imprimo fecha hora en cada visita y genero contador.
app.use(function(req, res, next) {
    console.log("Time: ", Date.now())
    visitCounter++
    next()
    })

//por cada request, creo arc-hivo y guardo contador.
router.use(function (req, res, next) {
    Container.prototype.createFile()
    requestCounter++
    next()
})

app.get('/', (req, res) => {

    res.render('home')
})

app.get('/lista', (req, res) => {
    let listaProductos = Container.prototype.getAllObjects()
    res.render('products',{list: listaProductos, showList: true})
})

router.get('/:id', (req, res) => {
    try {
        console.log("GET por ID")
        let productos = Container.prototype.getAllObjects()
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

    Container.prototype.saveObjects(obj)
    console.log("Producto guardado" + JSON.stringify(obj))

    return res.redirect("/lista")
})

router.put('/:id', (req, res) => {
    try{
        console.log("------new put request-------")
        let productos = Container.prototype.getAllObjects()
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
        Container.prototype.updateObjectById(req.body, id)
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
        let listaProductos = Container.prototype.getAllObjects()
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
            Container.prototype.deleteObjectById(id)
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