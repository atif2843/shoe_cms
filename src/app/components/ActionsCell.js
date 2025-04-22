"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const ActionsCell = ({ user, onDelete }) => {
const [isDeleting, setIsDeleting] = useState(false);

      const handleDelete = async () => {
        try {
          setIsDeleting(true);
          const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', user.id);

          if (error) throw error;
          
          // Call the onDelete callback with success message
          if (onDelete) onDelete(true, 'User deleted successfully');
          // Refresh the table data
          window.location.reload();
        } catch (error) {
          // Call the onDelete callback with error message
          if (onDelete) onDelete(false, 'Error deleting user');
          console.error('Error:', error);
        } finally {
          setIsDeleting(false);
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="mr-2">Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    };

export default ActionsCell;