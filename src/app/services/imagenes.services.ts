/* The code snippet you provided is a TypeScript service class for managing images in an Angular
application. Let's break down the imports: */
import { ComponentFactoryResolver, Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { ImagenesModel } from '../models/imagenes.model';
import { FileItems } from '../models/file.items';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import Swal from 'sweetalert2';

/* La clase ImagenesService en TypeScript es un servicio inyectable que interactúa con un
AngularFirestoreCollection para recuperar y mapear datos de ImagenesModel. */
@Injectable({
    providedIn: 'root'
})
export class ImagenesService {
    private CARPETA_IMAGENES = 'img';
    private imagenesCollection: AngularFirestoreCollection<ImagenesModel>
    progress: any;

    constructor(private db: AngularFirestore) {
        this.imagenesCollection = db.collection<ImagenesModel>('tbl_face');
    }

    getImagenes(): Observable<ImagenesModel[]> {
        return this.imagenesCollection.snapshotChanges().pipe(
            map(actions => actions.map(a => {
                const data = a.payload.doc.data() as ImagenesModel;
                const id = a.payload.doc.id;
                return { id, ...data }
            })
            )
        )
    }

    /* La función 'getImagen(id: any)' en la clase 'ImagenesService' se utiliza para recuperar un
documento de imagen de la colección Firestore basado en el 'id' proporcionado. Devuelve un
Observable que emite los datos del documento. */
    getImagen(id: any) {
        return this.imagenesCollection.doc(id).valueChanges();
    }

    cargarImagenesFirebase(imagen: FileItems, imagesData: ImagenesModel) {
        const storage = getStorage();
        let item = imagen;
        let imagenTrim = imagesData.nombreImagen;
        const storageRef = ref(storage, `${this.CARPETA_IMAGENES}/${imagenTrim.replace(/ /g, '')}`);
        const uploadTask = uploadBytesResumable(storageRef, item.archivo);
        uploadTask.on('state_changed', (snapshot) => {
            this.progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(this.progress);
        }, (err) => {
            console.log('Error al subir archivo', err);
        }, () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                item.url = downloadURL;
                this.guardarImagen({
                    nombreImagen: imagesData.nombreImagen,
                    imgUrl: item.url,
                    fechaNacimiento: imagesData.fechaNacimiento,
                    tlfEmergencia: imagesData.tlfEmergencia,
                    cedula: imagesData.cedula
                });
            });
        }
        )
    }

    /**
     * La función 'guardarImagen' es una función asíncrona en TypeScript que guarda una imagen
* Objeción a una colección en una base de datos.
* @param imagen - El parámetro 'imagen' en la función 'guardarImagen' es un objeto con el atributo
* Siguientes propiedades:
* @returns La función 'guardarImagen' está devolviendo una Promesa. La Promesa se resolverá con el
* resultado de añadir el objeto 'imagen' a la colección 'tbl_face' en la base de datos.
     */
    async guardarImagen(imagen: {
        nombreImagen: string,
        imgUrl: string, fechaNacimiento: string,
        tlfEmergencia: string,
        cedula: string
    }): Promise<any> {
        try {
            return await this.db.collection('tbl_face').add(imagen);
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * La función 'eliminarImagen' borra una imagen del almacenamiento y un documento correspondiente de un
     * Colección Firestore.
     * @param {string} id - El parámetro 'id' en la función 'eliminarImagen' probablemente se refiere a la
     * identificador único del documento o entidad en una base de datos que desea eliminar junto con el
     * Imagen asociada. Este identificador se utiliza para localizar y eliminar el documento específico de la
     *base de datos.
     * @param {string} imagenNombre - El parámetro 'imagenNombre' representa el nombre de la imagen
     * archivo que desea eliminar.
     * @returns La función 'eliminarImagen' está devolviendo una promesa que borra un documento con el
     * especificado 'id' de la 'imagenesCollection'.
     */
    public eliminarImagen(id: string, imagenNombre: string) {
        const storage = getStorage();
        const deleteImg = ref(storage, `${this.CARPETA_IMAGENES}/${imagenNombre.replace(/ /g, '')}`);
        deleteObject(deleteImg).then(() => {
            Swal.fire('EXITO', 'El registro se elimino correctamente', 'success');
        }).catch((err) => {
            console.error(err);
        });
        return this.imagenesCollection.doc(id).delete();
    }

    // Agregar el actualizar:
    async actualizarImagen(id: string, datosActualizados: { nombreImagen: string, fechaNacimiento: string, tlfEmergencia: string, cedula: string }): Promise<void> {
        try {
            await this.imagenesCollection.doc(id).update(datosActualizados);
        } catch (error) {
            console.error('Error al actualizar la imagen:', error);
            throw error; // Lanza el error para manejarlo en el componente
        }
    }
}