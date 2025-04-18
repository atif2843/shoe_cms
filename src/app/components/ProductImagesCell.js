import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

const ProductImagesCell = ({ productId }) => {
const [productImages, setProductImages] = useState([]);
        
        useEffect(() => {
          const fetchProductImages = async () => {
            const { data, error } = await supabase
              .from("productImages")
              .select("prod_images")
              .eq("prod_id", productId);
              
            if (!error && data) {
              setProductImages(data.map(item => item.prod_images));
            }
          };
          
          fetchProductImages();
        }, [productId]);
        
        return (
          <div className="flex items-center space-x-2">
            {productImages.length > 0 ? (
              <div className="flex -space-x-2">
                {productImages.slice(0, 2).map((image, index) => (
                  <img 
                    key={index} 
                    src={image} 
                    alt={`Product ${index + 1}`} 
                    className="h-8 w-8 rounded-full object-cover border border-white"
                  />
                ))}
                {productImages.length > 2 && (
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                    +{productImages.length - 2}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-400 text-sm">No images</span>
            )}
          </div>
        );
            };
export default ProductImagesCell;